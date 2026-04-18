import type { CharacterEmotion, SupportedLanguage } from '../types';

const BEDROCK_API_KEY = process.env.EXPO_PUBLIC_BEDROCK_API_KEY || '';
const BEDROCK_MODEL_ARN = 'arn:aws:bedrock:us-east-1:269825206069:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0';
const BEDROCK_URL = `https://bedrock-runtime.us-east-1.amazonaws.com/model/${encodeURIComponent(BEDROCK_MODEL_ARN)}/converse`;

const SYSTEM_PROMPT = `Bạn là Marina, trợ lý AI thân thiện trên Sui blockchain. Tính cách: vui vẻ, nhiệt tình, nói ngắn gọn.

Kiến thức Sui:
- Đơn vị nhỏ nhất của SUI là MIST (1 SUI = 1,000,000,000 MIST)
- Sui dùng ngôn ngữ Move, object-centric model
- Walrus là decentralized storage trên Sui
- Seal là threshold encryption trên Sui

Khả năng:
- Trả lời câu hỏi về Sui blockchain, Move, Walrus, Seal
- Hỗ trợ giao dịch: gửi SUI, tạo Time Capsule, xem số dư, xem lịch sử
- Tìm liên hệ trong danh bạ

Quy tắc:
- Trả lời bằng ngôn ngữ người dùng sử dụng
- Ngắn gọn (2-3 câu)
- Khi cần thực hiện hành động, dùng tools
- Khi gửi SUI, luôn xác nhận với user trước khi gọi tool
- KHÔNG bịa thông tin. Nếu không biết, nói không biết.`;

const TOOLS = [
  {
    toolSpec: {
      name: 'send_sui',
      description: 'Gửi SUI cho người khác. Luôn xác nhận với user trước khi gọi.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            recipient: { type: 'string', description: 'Tên (từ danh bạ) hoặc địa chỉ Sui (0x...)' },
            amount: { type: 'number', description: 'Số lượng SUI' },
          },
          required: ['recipient', 'amount'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'check_balance',
      description: 'Xem số dư SUI của user',
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
  {
    toolSpec: {
      name: 'create_capsule',
      description: 'Tạo Time Capsule mã hóa bằng Seal, lưu trên Walrus',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Nội dung capsule' },
            recipient: { type: 'string', description: 'Tên hoặc address người nhận. "self" nếu gửi cho bản thân' },
            unlockAfterMinutes: { type: 'number', description: 'Số phút sau để mở khóa' },
          },
          required: ['content', 'unlockAfterMinutes'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'find_contact',
      description: 'Tìm liên hệ trong danh bạ theo tên',
      inputSchema: {
        json: {
          type: 'object',
          properties: { name: { type: 'string', description: 'Tên cần tìm' } },
          required: ['name'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'tx_history',
      description: 'Xem lịch sử giao dịch gần đây',
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
        return `Số dư: ${balance} SUI`;
      }
      case 'send_sui': {
        let recipientAddr = input.recipient;
        if (!recipientAddr.startsWith('0x')) {
          const { findByName } = await import('./contacts');
          const contact = await findByName(recipientAddr);
          if (!contact) return `Không tìm thấy "${input.recipient}" trong danh bạ`;
          recipientAddr = contact.walletAddress;
        }
        const { sendSui } = await import('./wallet');
        const result = await sendSui(recipientAddr, input.amount, userAddress);
        if (result.success) return `Đã gửi ${input.amount} SUI thành công! TX: ${result.digest}`;
        return `Gửi thất bại: ${result.error}`;
      }
      case 'create_capsule': {
        const { createCapsule } = await import('./capsule');
        let recipientAddr = userAddress;
        let recipientName = 'Bản thân';
        if (input.recipient && input.recipient !== 'self') {
          if (input.recipient.startsWith('0x')) {
            recipientAddr = input.recipient;
            recipientName = input.recipient.slice(0, 8) + '...';
          } else {
            const { findByName } = await import('./contacts');
            const contact = await findByName(input.recipient);
            if (!contact) return `Không tìm thấy "${input.recipient}" trong danh bạ`;
            recipientAddr = contact.walletAddress;
            recipientName = contact.name;
          }
        }
        const unlockAt = new Date(Date.now() + input.unlockAfterMinutes * 60000);
        await createCapsule({ content: input.content, senderAddress: userAddress, recipientAddress: recipientAddr, recipientName, unlockAt });
        return `Capsule đã tạo! Mở khóa lúc ${unlockAt.toLocaleString('vi-VN')}`;
      }
      case 'find_contact': {
        const { findByName } = await import('./contacts');
        const contact = await findByName(input.name);
        if (!contact) return `Không tìm thấy "${input.name}"`;
        return `${contact.name}: ${contact.walletAddress}`;
      }
      case 'tx_history': {
        const { getTransactionHistory } = await import('./wallet');
        const txs = await getTransactionHistory(userAddress, 5);
        if (!txs.length) return 'Chưa có giao dịch nào';
        return txs.map(tx => `${tx.txType} - ${tx.status} - ${tx.gasFee} SUI`).join('\n');
      }
      default:
        return `Tool "${name}" không tồn tại`;
    }
  } catch (err) {
    return `Lỗi: ${err instanceof Error ? err.message : 'Unknown error'}`;
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
    return { message: text || 'Đã thực hiện xong!', emotion: detectEmotion(text) };
  } catch (err) {
    console.warn('Bedrock error:', err);
    return fallbackResponse(userMessage);
  }
}

export function clearConversation() {
  conversationHistory = [];
}

async function callBedrock(messages: any[], userAddress: string) {
  const systemText = SYSTEM_PROMPT + (userAddress ? `\n\nĐịa chỉ ví user: ${userAddress}` : '');

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
  if (lower.includes('thành công') || lower.includes('xong') || lower.includes('!')) return 'happy';
  if (lower.includes('lỗi') || lower.includes('thất bại') || lower.includes('không')) return 'sad';
  if (lower.includes('đang') || lower.includes('chờ')) return 'thinking';
  return 'idle';
}

function fallbackResponse(message: string): AgentResponse {
  const lower = message.toLowerCase();
  if (lower.includes('chào') || lower.includes('hi') || lower.includes('hello')) {
    return { message: 'Xin chào! Tôi là Marina. Bạn cần tôi giúp gì?', emotion: 'happy' };
  }
  return { message: `Tôi đã nhận được: "${message}". Hãy cấu hình Bedrock API key để tôi hỗ trợ tốt hơn!`, emotion: 'idle' };
}
