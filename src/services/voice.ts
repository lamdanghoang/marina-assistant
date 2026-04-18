import * as Speech from 'expo-speech';
import type { SupportedLanguage } from '../types';

// === Text-to-Speech ===

export async function speak(text: string, language: SupportedLanguage): Promise<void> {
  // Strip emojis for TTS (keep in chat UI)
  let processed = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  if (language === 'vi-VN') {
    processed = processed.replace(/\bAI\b/g, 'ây ai');
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
      onError?.('Speech recognition không khả dụng trên thiết bị này');
      return;
    }

    // Request permission
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      onError?.('Cần quyền truy cập microphone');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: language,
      interimResults: true,
      continuous: false,
    });
  } catch (err) {
    onError?.(err instanceof Error ? err.message : 'STT không khả dụng');
  }
}

export async function stopListening(): Promise<void> {
  try {
    const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
    ExpoSpeechRecognitionModule.stop();
  } catch {}
}
