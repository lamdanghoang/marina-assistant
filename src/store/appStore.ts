import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthSession, ChatMessage, CharacterAnimation, SupportedLanguage } from '../types';

interface AppState {
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;
  language: SupportedLanguage;
  setLanguage: (l: SupportedLanguage) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
  animation: CharacterAnimation;
  setAnimation: (a: CharacterAnimation) => void;
  balance: string | null;
  setBalance: (b: string) => void;
  loadPreferences: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),

  chatMessages: [],
  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages.slice(-49), m] })),
  clearChat: () => set({ chatMessages: [] }),

  language: 'en-US',
  setLanguage: (language) => {
    set({ language });
    SecureStore.setItemAsync('marina_language', language).catch(() => {});
  },
  voiceEnabled: true,
  setVoiceEnabled: (voiceEnabled) => {
    set({ voiceEnabled });
    SecureStore.setItemAsync('marina_voice', voiceEnabled ? '1' : '0').catch(() => {});
  },

  animation: 'idle',
  setAnimation: (animation) => set({ animation }),

  balance: null,
  setBalance: (balance) => set({ balance }),

  loadPreferences: async () => {
    const lang = await SecureStore.getItemAsync('marina_language');
    const voice = await SecureStore.getItemAsync('marina_voice');
    set({
      language: (lang as SupportedLanguage) || 'en-US',
      voiceEnabled: voice !== '0',
    });
  },
}));
