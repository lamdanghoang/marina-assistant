import type { CharacterEmotion, SupportedLanguage } from '../types';

const BEDROCK_API_KEY = process.env.EXPO_PUBLIC_BEDROCK_API_KEY || '';
const BEDROCK_MODEL_ARN = 'arn:aws:bedrock:us-east-1:269825206069:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0';
const BEDROCK_URL = `https://bedrock-runtime.us-east-1.amazonaws.com/model/${encodeURIComponent(BEDROCK_MODEL_ARN)}/converse`;

const SYSTEM_PROMPT = `You are Marina, a friendly AI assistant on Sui blockchain. Personality: cheerful, enthusiastic, concise.

Sui knowledge:
- The smallest unit of SUI is MIST (1 SUI = 1,000,000,000 MIST)
- Sui uses the Move language, object-centric model
- Walrus is decentralized storage on Sui
- Seal is threshold encryption on Sui

Capabilities:
- Answer questions about Sui blockchain, Move, Walrus, Seal
- Assist with transactions: send SUI, create Time Capsule, check balance, view history
- Find contacts in the address book

Rules:
- Reply in the language the user uses
- Be concise (2-3 sentences)
- When an action is needed, use tools
- When sending SUI, always confirm with the user before calling the tool
- Do NOT make up information. If you don't know, say you don't know.`;

const TOOLS = [
  {
    toolSpec: {
      name: 'send_sui',
      description: 'Send SUI to someone. Always confirm with the user before calling.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            recipient: { type: 'string', description: 'Name (from address book) or Sui address (0x...)' },
            amount: { type: 'number', description: 'Amount of SUI' },
          },
          required: ['recipient', 'amount'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'check_balance',
      description: 'Check user\'s SUI balance',
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
  {
    toolSpec: {
      name: 'create_capsule',
      description: 'Create a Time Capsule encrypted with Seal, stored on Walrus',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Capsule content' },
            recipient: { type: 'string', description: 'Name or address of recipient. "self" if sending to yourself' },
            unlockAfterMinutes: { type: 'number', description: 'Minutes until unlock' },
          },
          required: ['content', 'unlockAfterMinutes'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'find_contact',
      description: 'Find a contact in the address book by name',
      inputSchema: {
        json: {
          type: 'object',
          properties: { name: { type: 'string', description: 'Name to search for' } },
          required: ['name'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'tx_history',
      description: 'View recent transaction history',
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
];

// Tool executor
async function executeTool(name: string, input: any, userAddress: string): Promise<string> {
  try {
    switch (name) {
      case 'check_balance': {
        const { getBalance } = await import('./wallet');
        const balance = await getBalance(userAddress);
        return `Balance: ${balance} SUI`;
      }
      case 'send_sui': {
        let recipientAddr = input.recipient;
        if (!recipientAddr.startsWith('0x')) {
          const { findByName } = await import('./contacts');
          const contact = await findByName(recipientAddr, userAddress);
          if (!contact) return `"${input.recipient}" not found in address book`;
          recipientAddr = contact.walletAddress;
        }
        const { sendSui } = await import('./wallet');
        const result = await sendSui(recipientAddr, input.amount, userAddress);
        const recipientLabel = input.recipient.startsWith('0x') ? `wallet ending in ${recipientAddr.slice(-4)}` : input.recipient;
        if (result.success) return `Done! Sent ${input.amount} SUI to ${recipientLabel}.\nhttps://suiscan.xyz/testnet/tx/${result.digest}`;
        return `Send failed: ${result.error}`;
      }
      case 'create_capsule': {
        const { createCapsule } = await import('./capsule');
        let recipientAddr = userAddress;
        let recipientName = 'Self';
        if (input.recipient && input.recipient !== 'self') {
          if (input.recipient.startsWith('0x')) {
            recipientAddr = input.recipient;
            recipientName = input.recipient.slice(0, 8) + '...';
          } else {
            const { findByName } = await import('./contacts');
            const contact = await findByName(input.recipient, userAddress);
            if (!contact) return `"${input.recipient}" not found in address book`;
            recipientAddr = contact.walletAddress;
            recipientName = contact.name;
          }
        }
        const unlockAt = new Date(Date.now() + input.unlockAfterMinutes * 60000);
        await createCapsule({ content: input.content, senderAddress: userAddress, recipientAddress: recipientAddr, recipientName, unlockAt });
        return `Capsule created! Unlocks at ${unlockAt.toLocaleString('en-US')}`;
      }
      case 'find_contact': {
        const { findByName } = await import('./contacts');
        const contact = await findByName(input.name, userAddress);
        if (!contact) return `"${input.name}" not found`;
        return `Found ${contact.name} (wallet ...${contact.walletAddress.slice(-4)})`;
      }
      case 'tx_history': {
        const { getTransactionHistory } = await import('./wallet');
        const txs = await getTransactionHistory(userAddress, 5);
        if (!txs.length) return 'No transactions yet';
        return txs.map(tx => `${tx.txType} - ${tx.status} - ${tx.gasFee} SUI`).join('\n');
      }
      default:
        return `Tool "${name}" does not exist`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export interface AgentResponse {
  message: string;
  emotion: CharacterEmotion;
  toolUsed?: string;
}

// Conversation history for multi-turn
let conversationHistory: any[] = [];

export async function sendMessage(
  userMessage: string,
  language: SupportedLanguage,
  userAddress?: string,
): Promise<AgentResponse> {
  if (!BEDROCK_API_KEY) {
    return fallbackResponse(userMessage);
  }

  const addr = userAddress || '';

  // Add user message to history
  conversationHistory.push({ role: 'user', content: [{ text: userMessage }] });

  // Keep last 20 messages to avoid token limit
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  try {
    let response = await callBedrock(conversationHistory, addr);
    let assistantContent = response.output?.message?.content ?? [];
    let stopReason = response.stopReason;

    // Agent loop — execute tools
    let loops = 0;
    while (stopReason === 'tool_use' && loops < 5) {
      loops++;
      conversationHistory.push({ role: 'assistant', content: assistantContent });

      const toolResults: any[] = [];
      for (const block of assistantContent) {
        if (block.toolUse) {
          const result = await executeTool(block.toolUse.name, block.toolUse.input, addr);
          toolResults.push({
            toolResult: {
              toolUseId: block.toolUse.toolUseId,
              content: [{ text: result }],
            },
          });
        }
      }

      conversationHistory.push({ role: 'user', content: toolResults });
      response = await callBedrock(conversationHistory, addr);
      assistantContent = response.output?.message?.content ?? [];
      stopReason = response.stopReason;
    }

    // Save assistant response to history
    conversationHistory.push({ role: 'assistant', content: assistantContent });

    const text = assistantContent.map((b: any) => b.text).filter(Boolean).join('');
    return { message: text || 'Done!', emotion: detectEmotion(text) };
  } catch (err) {
    console.warn('Bedrock error:', err);
    return fallbackResponse(userMessage);
  }
}

export function clearConversation() {
  conversationHistory = [];
}

async function callBedrock(messages: any[], userAddress: string) {
  const systemText = SYSTEM_PROMPT + (userAddress ? `\n\nUser wallet address: ${userAddress}` : '');

  const res = await fetch(BEDROCK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEDROCK_API_KEY}`,
    },
    body: JSON.stringify({
      messages,
      system: [{ text: systemText }],
      toolConfig: { tools: TOOLS },
      inferenceConfig: { maxTokens: 500 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bedrock ${res.status}: ${err}`);
  }
  return res.json();
}

function detectEmotion(text: string): CharacterEmotion {
  const lower = text.toLowerCase();
  if (lower.includes('success') || lower.includes('done') || lower.includes('!')) return 'happy';
  if (lower.includes('error') || lower.includes('fail') || lower.includes('not')) return 'sad';
  if (lower.includes('processing') || lower.includes('wait')) return 'thinking';
  return 'idle';
}

function fallbackResponse(message: string): AgentResponse {
  const lower = message.toLowerCase();
  if (lower.includes('chào') || lower.includes('hi') || lower.includes('hello')) {
    return { message: 'Hello! I\'m Marina. How can I help you?', emotion: 'happy' };
  }
  return { message: `I received: "${message}". Please configure the Bedrock API key so I can assist you better!`, emotion: 'idle' };
}
