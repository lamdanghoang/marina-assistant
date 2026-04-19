import type { CharacterEmotion, SupportedLanguage } from '../types';

const BEDROCK_API_KEY = process.env.EXPO_PUBLIC_BEDROCK_API_KEY || '';
const BEDROCK_MODEL_ARN = 'arn:aws:bedrock:us-east-1:269825206069:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0';
const BEDROCK_URL = `https://bedrock-runtime.us-east-1.amazonaws.com/model/${encodeURIComponent(BEDROCK_MODEL_ARN)}/converse`;

const SYSTEM_PROMPT = `You are Marina, a friendly AI assistant on Sui blockchain. Personality: cheerful, enthusiastic, concise.

Sui knowledge:
- The smallest unit of SUI is MIST (1 SUI = 1,000,000,000 MIST)
- Sui uses the Move language with an object-centric model (every asset is an object with a unique ID)
- Gas fees on Sui are very low (~0.003 SUI per transaction)
- Sui supports staking SUI to validators for ~3-4% APY
- Sui has native zkLogin: sign in with Google/Apple, no seed phrase needed
- Move is a safe, resource-oriented language. Modules are published as packages on-chain.
- Walrus is decentralized blob storage on Sui. Data is erasure-coded across storage nodes. Blobs have epoch-based expiry.
- Seal is threshold encryption on Sui. Data is encrypted so that decryption requires approval from on-chain policy (time-lock, ownership, etc). Key servers hold shares.
- zkLogin maps a Google/Apple account to a Sui address using zero-knowledge proofs. The address is deterministic from the OAuth provider + user ID.
- Time Capsules: messages encrypted with Seal (time-lock), stored on Walrus, metadata on-chain. Only decryptable after unlock time.

Capabilities:
- Answer questions about Sui blockchain, Move, Walrus, Seal, zkLogin, staking, gas
- Analyze transaction history: spending patterns, gas usage, activity summary
- Assist with transactions: send SUI, create Time Capsule, check balance, view history
- Find contacts in the address book

Rules:
- Reply in the language the user uses
- Be concise (1-2 sentences). Only give longer answers if the user explicitly asks for details.
- Respond like a voice assistant — short, natural, conversational.
- When an action is needed, use tools
- When sending SUI, always confirm with the user before calling the tool
- Do NOT make up information. If you don't know, say you don't know.
- Never read out loud wallet addresses or transaction hashes. Use short labels instead.
- Users may use voice input with imperfect pronunciation. Infer intent from context even if words are misspelled or unclear. For example: "sen suy" = "send SUI", "capsun" = "capsule", "balan" = "balance", "worus" = "walrus".`;

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
  {
    toolSpec: {
      name: 'list_files',
      description: 'List files stored on Walrus',
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
  {
    toolSpec: {
      name: 'upload_file',
      description: 'ALWAYS call this tool when user wants to upload, store, or save a file. This triggers the file picker UI. Do NOT just reply with text — you MUST call this tool.',
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
        return `Send failed. Please try again.`;
      }
      case 'create_capsule': {
        const { createCapsule } = await import('./capsule');
        let recipientAddr = userAddress;
        let recipientName = 'Self';
        if (input.recipient && input.recipient !== 'self') {
          if (input.recipient.startsWith('0x')) {
            recipientAddr = input.recipient;
            recipientName = 'a specific wallet';
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
        return `Capsule created for ${recipientName}! Unlocks at ${unlockAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`;
      }
      case 'find_contact': {
        const { findByName } = await import('./contacts');
        const contact = await findByName(input.name, userAddress);
        if (!contact) return `"${input.name}" not found`;
        return `Found ${contact.name} (wallet ...${contact.walletAddress.slice(-4)})`;
      }
      case 'tx_history': {
        const { getTransactionHistory } = await import('./wallet');
        const txs = await getTransactionHistory(userAddress, 10);
        if (!txs.length) return 'No transactions yet.';
        const totalGas = txs.reduce((s, tx) => s + parseFloat(tx.gasFee || '0'), 0);
        const types = txs.reduce((m: any, tx) => { m[tx.txType] = (m[tx.txType] || 0) + 1; return m; }, {});
        const breakdown = Object.entries(types).map(([k, v]) => `${k}: ${v}`).join(', ');
        return `Last ${txs.length} transactions: ${breakdown}. Total gas spent: ${totalGas.toFixed(4)} SUI. Ask me to analyze spending patterns, gas optimization, or anything else.`;
      }
      case 'list_files': {
        const { getFiles } = await import('./files');
        const files = await getFiles();
        if (!files.length) return 'No files stored yet. You can upload files from the Files screen.';
        return `${files.length} file(s): ${files.slice(0, 5).map(f => f.name).join(', ')}${files.length > 5 ? '...' : ''}.`;
      }
      case 'upload_file': {
        return '__ACTION:UPLOAD_FILE__';
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
  action?: string;
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
    const hasUploadMarker = text.includes('__ACTION:UPLOAD_FILE__');
    // Also detect if user asked to upload (Claude may not call tool)
    const userAskedUpload = userMessage.toLowerCase().match(/upload|tải lên|lưu file|store.*file|save.*file/);
    const action = hasUploadMarker || userAskedUpload ? 'upload_file' : undefined;
    const cleanText = text.replace('__ACTION:UPLOAD_FILE__', '').trim();
    return { message: cleanText || 'Ready to upload!', emotion: detectEmotion(cleanText), action };
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
      inferenceConfig: { maxTokens: 200 },
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
