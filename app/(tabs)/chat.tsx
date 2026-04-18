import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Mic } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { useAppStore } from '../../src/store/appStore';
import { sendMessage, createMessage } from '../../src/services/chat';
import { speak, startListening, stopListening } from '../../src/services/voice';
import type { ChatMessage } from '../../src/types';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const session = useAppStore((s) => s.session);
  const language = useAppStore((s) => s.language);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const messages = useAppStore((s) => s.chatMessages);
  const addMessage = useAppStore((s) => s.addChatMessage);
  const setAnimation = useAppStore((s) => s.setAnimation);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    addMessage(createMessage(text.trim(), 'user', language));
    setInput(''); setLoading(true); setAnimation('thinking');
    try {
      const r = await sendMessage(text.trim(), language, session?.walletAddress);
      addMessage(createMessage(r.message, 'marina', language));
      setLoading(false); setAnimation(r.emotion === 'happy' ? 'happy' : 'idle');
      if (voiceEnabled) { setAnimation('talking'); await speak(r.message, language); setAnimation('idle'); }
    } catch {
      addMessage(createMessage('Sorry, an error occurred.', 'marina', language));
      setLoading(false); setAnimation('sad');
    }
  }, [loading, language, voiceEnabled, session?.walletAddress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.timeRow}><Text style={styles.timeText}>Today</Text></View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <ChatBubble content={item.content} sender={item.sender} action={item.action} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      {loading && <View style={styles.typing}><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /><Text style={styles.typingText}>Marina is processing</Text></View>}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) + 60 }]}>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Message Marina AI..." placeholderTextColor={colors.onSurfaceVariant + '40'} value={input} onChangeText={setInput} onSubmitEditing={() => handleSend(input)} returnKeyType="send" editable={!loading} />
            <TouchableOpacity style={[styles.micSmall, listening && { backgroundColor: colors.error }]} onPress={async () => {
              if (listening) { await stopListening(); setListening(false); return; }
              setListening(true);
              try {
                const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
                ExpoSpeechRecognitionModule.removeAllListeners('result');
                ExpoSpeechRecognitionModule.removeAllListeners('error');
                ExpoSpeechRecognitionModule.removeAllListeners('end');
                ExpoSpeechRecognitionModule.addListener('result', (e: any) => { const t = e.results?.[0]?.transcript; if (t && e.isFinal) { setListening(false); handleSend(t); } else if (t) setInput(t); });
                ExpoSpeechRecognitionModule.addListener('error', () => setListening(false));
                ExpoSpeechRecognitionModule.addListener('end', () => setListening(false));
                await startListening(language, () => {}, () => setListening(false));
              } catch { setListening(false); }
            }}>
              <Mic size={18} color={listening ? colors.surface : colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(input)} disabled={!input.trim() || loading}>
              <Send size={18} color={colors.surface} fill={colors.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  timeRow: { alignItems: 'center', paddingVertical: spacing.md },
  timeText: { fontSize: typography.sizes.xs, letterSpacing: 3, color: 'rgba(160,174,174,0.5)', textTransform: 'uppercase' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(143,245,255,0.4)' },
  typingText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginLeft: spacing.sm, letterSpacing: 2, textTransform: 'uppercase' },
  inputBar: { paddingHorizontal: spacing.lg },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.glassBorder, paddingLeft: spacing.xl, paddingRight: spacing.sm, gap: spacing.sm },
  input: { flex: 1, color: colors.onSurface, fontSize: typography.sizes.md, paddingVertical: spacing.lg },
  micSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
});
