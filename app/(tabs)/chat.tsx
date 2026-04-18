import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import type { ChatMessage } from '../../src/types';

const INITIAL: ChatMessage[] = [
  { id: '1', content: "Hello! I'm synchronized with the Sui network. How can I assist your digital journey today?", sender: 'marina', timestamp: new Date(), language: 'en-US' },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = { id: Date.now().toString(), content: input.trim(), sender: 'user', timestamp: new Date(), language: 'en-US' };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd(), 100);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.timeStamp}>
        <Text style={styles.timeText}>Today</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <ChatBubble content={item.content} sender={item.sender} action={item.action} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) + 60 }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message Marina AI..."
              placeholderTextColor={colors.onSurfaceVariant + '66'}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!input.trim()}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  timeStamp: { alignItems: 'center', paddingVertical: spacing.md },
  timeText: { fontSize: typography.sizes.xs, letterSpacing: typography.tracking.wider, color: 'rgba(160,174,174,0.5)', textTransform: 'uppercase' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  inputBar: { paddingHorizontal: spacing.lg },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.glassBorder, paddingLeft: spacing.xl, paddingRight: spacing.sm, gap: spacing.sm },
  input: { flex: 1, color: colors.onSurface, fontSize: typography.sizes.md, paddingVertical: spacing.lg },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.4, shadowRadius: 20 },
  sendIcon: { fontSize: 20, color: colors.primary },
});
