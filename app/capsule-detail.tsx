import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, Lock, Unlock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { useAppStore } from '../src/store/appStore';
import { getCapsules, unlockCapsule, isLocked, timeUntilUnlock } from '../src/services/capsule';

export default function CapsuleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAppStore((s) => s.session);
  const [capsule, setCapsule] = useState<any>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCapsules(session?.walletAddress).then(all => setCapsule(all.find(c => c.id === id) ?? null));
  }, [id, session?.walletAddress]);

  const handleUnlock = async () => {
    if (!capsule) return;
    setLoading(true);
    try {
      const text = await unlockCapsule(capsule, session?.walletAddress ?? '');
      setContent(text);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to open capsule');
    } finally {
      setLoading(false);
    }
  };

  if (!capsule) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Capsule not found</Text>
      </View>
    );
  }

  const locked = isLocked(capsule);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Capsule Insight</Text>
      </View>

      <GlassPanel style={styles.card}>
        {/* Status */}
        <View style={styles.statusArea}>
          <View style={[styles.statusIcon, locked ? styles.iconLocked : styles.iconUnlocked]}>
            <ShieldCheck size={40} color={locked ? colors.primary : colors.surface} />
            {locked && <Lock size={16} color={colors.primary} style={{ opacity: 0.4, marginTop: 4 }} />}
          </View>
          <Text style={styles.statusLabel}>{locked ? 'TIME-LOCKED' : 'DECRYPTED'}</Text>
          <Text style={styles.recipient}>{capsule.recipientName || 'Capsule'}</Text>
          {locked && <Text style={styles.countdown}>{timeUntilUnlock(capsule)}</Text>}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <DetailRow label="Recipient" value={capsule.recipientAddress ? `${capsule.recipientAddress.slice(0, 8)}...${capsule.recipientAddress.slice(-4)}` : ''} />
          <DetailRow label="Created" value={capsule.createdAt ? new Date(capsule.createdAt).toLocaleString() : ''} />
          <DetailRow label="Unlock At" value={capsule.unlockAt ? new Date(capsule.unlockAt).toLocaleString() : ''} />
          {capsule.objectId && <DetailRow label="Object ID" value={`${capsule.objectId.slice(0, 10)}...`} />}
        </View>

        {/* Content or unlock button */}
        {content ? (
          <GlassPanel style={styles.contentCard}>
            <Text style={styles.contentLabel}>DECRYPTED PAYLOAD</Text>
            <Text style={styles.contentText}>{content}</Text>
          </GlassPanel>
        ) : locked ? (
          <View style={styles.lockedInfo}>
            <Lock size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.lockedText}>Payload encrypted. Awaiting temporal unlock.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.surface} /> : (
              <><Unlock size={18} color={colors.surface} /><Text style={styles.unlockText}>DECRYPT CAPSULE</Text></>
            )}
          </TouchableOpacity>
        )}
      </GlassPanel>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  iconLocked: { backgroundColor: colors.surfaceContainer },
  iconUnlocked: { backgroundColor: colors.primary, transform: [{ rotate: '6deg' }] },
  statusLabel: { fontSize: typography.sizes.xs, letterSpacing: 4, color: colors.onSurfaceVariant, fontWeight: typography.weights.bold },
  recipient: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface, marginTop: spacing.sm },
  countdown: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.md, fontVariant: ['tabular-nums'] },
  details: { padding: spacing.xxl, gap: spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  detailValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.onSurface },
  contentCard: { margin: spacing.xl, padding: spacing.xl, backgroundColor: colors.surfaceContainerLow },
  contentLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.primary, fontWeight: typography.weights.bold, marginBottom: spacing.sm },
  contentText: { fontSize: typography.sizes.md, color: colors.onSurface, lineHeight: 22 },
  lockedInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.xxl, justifyContent: 'center' },
  lockedText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, margin: spacing.xl, paddingVertical: 18, borderRadius: borderRadius.xl, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  unlockText: { color: colors.surface, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm, letterSpacing: 3 },
});
