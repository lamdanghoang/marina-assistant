import * as Speech from 'expo-speech';
import type { SupportedLanguage } from '../types';

// === Text-to-Speech ===

export async function speak(text: string, language: SupportedLanguage): Promise<void> {
  // Strip emojis for TTS (keep in chat UI)
  let processed = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  if (language === 'vi-VN') {
    const viReplacements: [RegExp, string][] = [
      [/\bAI\b/g, 'ây ai'],
      [/\bSUI\b/gi, 'xui'],
      [/\bSeal\b/gi, 'xiu'],
      [/\bWalrus\b/gi, 'wol-rớt'],
      [/\bzkLogin\b/gi, 'zi cây lốc gin'],
      [/\bMove\b/g, 'muv'],
      [/\bMIST\b/g, 'mít'],
      [/\bAPY\b/g, 'ây pi ai'],
      [/\bgas\b/gi, 'gát'],
      [/\bstaking\b/gi, 'stây-king'],
      [/\bblockchain\b/gi, 'blóc-chên'],
      [/\btransaction\b/gi, 'tran-zắc-sần'],
      [/\bwallet\b/gi, 'wol-lét'],
      [/\bcapsule\b/gi, 'cap-xiu'],
    ];
    for (const [regex, replacement] of viReplacements) {
      processed = processed.replace(regex, replacement);
    }
  }

  return new Promise((resolve) => {
    Speech.speak(processed, {
      language,
      pitch: 1.1,
      rate: 0.95,
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// === Speech-to-Text ===

export async function startListening(
  language: SupportedLanguage,
  onResult: (text: string) => void,
  onError?: (error: string) => void,
): Promise<void> {
  try {
    const { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } = await import('expo-speech-recognition');

    const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!available) {
      onError?.('Speech recognition is not available on this device');
      return;
    }

    // Request permission
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      onError?.('Microphone permission required');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: language,
      interimResults: true,
      continuous: false,
    });
  } catch (err) {
    onError?.(err instanceof Error ? err.message : 'STT not available');
  }
}

export async function stopListening(): Promise<void> {
  try {
    const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
    ExpoSpeechRecognitionModule.stop();
  } catch {}
}
