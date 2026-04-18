export type Screen = 'home' | 'chat' | 'capsules' | 'profile';

export type SupportedLanguage = 'en-US' | 'vi-VN';

export type CharacterAnimation = 'idle' | 'talking' | 'thinking' | 'happy' | 'sad' | 'interact';
export type CharacterEmotion = 'idle' | 'happy' | 'sad' | 'thinking' | 'excited';

export interface AuthSession {
  walletAddress: string;
  authMethod: 'wallet' | 'zklogin';
  publicKey?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'marina';
  timestamp: Date;
  language: SupportedLanguage;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'balance' | 'capsule' | 'transaction';
  detail?: string;
  capsuleId?: string;
  txId?: string;
}

export interface Contact {
  id: string;
  name: string;
  walletAddress: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'swap';
  title: string;
  date: string;
  amount: string;
  status: 'confirmed' | 'success' | 'pending';
}

export interface Capsule {
  id: string;
  blobId: string;
  senderAddress: string;
  recipientAddress: string;
  recipientName: string;
  unlockAt: string;
  createdAt: string;
  objectId?: string;
  status?: 'locked' | 'unlocked';
  protocol?: string;
}
