import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { CAPSULES } from '../src/constants/data';

export default function CapsuleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const capsule = CAPSULES.find(c => c.id === id);

  if (!capsule) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Capsule not found</Text>
      </View>
    );
  }

  const isLocked = capsule.status === 'locked';

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Capsule Insight</Text>
      </View>

      <GlassPanel style={styles.card}>
        {/* Status header */}
        <View style={styles.statusArea}>
          <View style={[styles.statusIcon, isLocked ? styles.statusLocked : styles.statusUnlocked]}>
            <ShieldCheck size={40} color={isLocked ? colors.primary : colors.surface} />
            {isLocked && <Lock size={16} color={colors.primary} style={{ opacity: 0.4, marginTop: 4 }} />}
          </View>
          <Text style={styles.statusLabel}>{isLocked ? 'TIME-LOCKED' : 'DECRYPTED'}</Text>
          <Text style={styles.recipient}>{capsule.recipient}</Text>
          {capsule.remainingTime && <Text style={styles.countdown}>{capsule.remainingTime}</Text>}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <DetailRow label="Created" value={capsule.createdDate} />
          <DetailRow label="Protocol" value={capsule.protocol} />
          <DetailRow label="Status" value={capsule.status.toUpperCase()} highlight />
        </View>

        {/* Preview (unlocked only) */}
        {capsule.preview && (
          <GlassPanel style={styles.previewCard}>
            <Text style={styles.previewLabel}>DECRYPTED PAYLOAD</Text>
            <Text style={styles.previewText}>{capsule.preview}</Text>
          </GlassPanel>
        )}

        {/* Actions */}
        {isLocked ? (
          <View style={styles.lockedInfo}>
            <Lock size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.lockedText}>Payload encrypted. Awaiting temporal unlock.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>VIEW ON EXPLORER</Text>
          </TouchableOpacity>
        )}
      </GlassPanel>
    </ScrollView>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: colors.secondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  card: { overflow: 'hidden' },
  statusArea: { alignItems: 'center', padding: spacing.xxl, backgroundColor: colors.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  statusIcon: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  statusLocked: { backgroundColor: colors.surfaceContainer },
  statusUnlocked: { backgroundColor: colors.primary, transform: [{ rotate: '6deg' }] },
  statusLabel: { fontSize: typography.sizes.xs, letterSpacing: 4, color: colors.onSurfaceVariant, fontWeight: typography.weights.bold },
  recipient: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface, marginTop: spacing.sm },
  countdown: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.md, fontVariant: ['tabular-nums'] },
  details: { padding: spacing.xxl, gap: spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  detailValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.onSurface },
  previewCard: { margin: spacing.xl, padding: spacing.xl, backgroundColor: colors.surfaceContainerLow },
  previewLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.primary, fontWeight: typography.weights.bold, marginBottom: spacing.sm },
  previewText: { fontSize: typography.sizes.md, color: colors.onSurface, lineHeight: 22, fontStyle: 'italic' },
  lockedInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.xxl, justifyContent: 'center' },
  lockedText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant },
  actionBtn: { margin: spacing.xl, paddingVertical: spacing.xl, borderRadius: borderRadius.lg, backgroundColor: 'rgba(143,245,255,0.1)', alignItems: 'center' },
  actionText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 3 },
});
