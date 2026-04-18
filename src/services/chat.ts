import type { ChatMessage, SupportedLanguage, CharacterEmotion } from '../types';
import { sendMessage as agentSendMessage } from './agent';
import * as SecureStore from 'expo-secure-store';

const HISTORY_KEY = 'marina_chat_history';

export interface AIResponse {
  message: string;
  emotion: CharacterEmotion;
}

export async function sendMessage(text: string, language: SupportedLanguage, userAddress?: string): Promise<AIResponse> {
  const result = await agentSendMessage(text, language, userAddress);
  return { message: result.message, emotion: result.emotion };
}

export function createMessage(content: string, sender: 'user' | 'marina', language: SupportedLanguage): ChatMessage {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), content, sender, timestamp: new Date(), language };
}

export async function saveHistory(messages: ChatMessage[]): Promise<void> {
  await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
}

export async function loadHistory(): Promise<ChatMessage[]> {
  const raw = await SecureStore.getItemAsync(HISTORY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
