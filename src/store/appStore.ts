import { create } from 'zustand';
import type { AuthSession, ChatMessage, CharacterAnimation, SupportedLanguage } from '../types';

interface AppState {
  // Auth
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;

  // Preferences
  language: SupportedLanguage;
  setLanguage: (l: SupportedLanguage) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;

  // Animation
  animation: CharacterAnimation;
  setAnimation: (a: CharacterAnimation) => void;

  // Wallet cache
  balance: string | null;
  setBalance: (b: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),

  chatMessages: [],
  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages.slice(-49), m] })),
  clearChat: () => set({ chatMessages: [] }),

  language: 'en-US',
  setLanguage: (language) => set({ language }),
  voiceEnabled: true,
  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),

  animation: 'idle',
  setAnimation: (animation) => set({ animation }),

  balance: null,
  setBalance: (balance) => set({ balance }),
}));
