import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';
import { Upload } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface Props {
  content: string;
  sender: 'user' | 'marina';
  action?: { type: string; detail?: string; capsuleId?: string; txId?: string };
  onUploadFile?: () => void;
}

const renderContent = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <Text key={i} style={styles.link} onPress={() => Linking.openURL(part)}>View on Explorer ↗</Text>
    ) : (
      <Text key={i}>{part}</Text>
    )
  );
};

export const ChatBubble: React.FC<Props> = ({ content, sender, action, onUploadFile }) => {
  const isUser = sender === 'user';
  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperMarina]}>
      <Text style={styles.label}>{isUser ? 'YOU' : 'MARINA'}</Text>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleMarina]}>
        <Text style={styles.text}>{renderContent(content)}</Text>
        {action?.type === 'upload_file' && onUploadFile && (
          <TouchableOpacity style={styles.uploadBtn} onPress={onUploadFile}>
            <Upload size={16} color={colors.surface} />
            <Text style={styles.uploadBtnText}>Choose File</Text>
          </TouchableOpacity>
        )}
        {action?.detail && (
          <View style={styles.actionCard}>
            <Text style={styles.actionLabel}>{action.type === 'balance' ? 'Available Balance' : 'Detail'}</Text>
            <Text style={styles.actionValue}>{action.detail}</Text>
          </View>
        )}
        {action?.capsuleId && (
          <View style={styles.capsuleCard}>
            <Text style={styles.capsuleTitle}>Capsule {action.capsuleId} Created</Text>
            {action.txId && <Text style={styles.capsuleTx}>TXID: {action.txId}</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { maxWidth: '85%', gap: 4 },
  wrapperUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperMarina: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  label: { fontSize: typography.sizes.xs, letterSpacing: typography.tracking.widest, color: colors.onSurfaceVariant, opacity: 0.7, marginHorizontal: 4 },
  bubble: { padding: spacing.lg, borderRadius: 16, borderWidth: 1 },
  bubbleUser: { backgroundColor: 'rgba(0,238,252,0.1)', borderColor: 'rgba(0,238,252,0.2)', borderTopRightRadius: 4 },
  bubbleMarina: { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderTopLeftRadius: 4 },
  text: { fontSize: typography.sizes.md, lineHeight: 22, color: colors.onSurface },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: spacing.md, alignSelf: 'flex-start' },
  uploadBtnText: { color: colors.surface, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  actionCard: { marginTop: spacing.md, backgroundColor: colors.surfaceContainerLow, padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder },
  actionLabel: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: typography.tracking.wider },
  actionValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface, marginTop: 2 },
  capsuleCard: { marginTop: spacing.lg, backgroundColor: 'rgba(143,245,255,0.05)', padding: spacing.lg, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(143,245,255,0.2)' },
  capsuleTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
  capsuleTx: { fontSize: typography.sizes.xs, color: 'rgba(143,245,255,0.6)', marginTop: 4 },
});
