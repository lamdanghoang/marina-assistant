import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck, Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { GlassPanel } from '../../src/components/shared/GlassPanel';
import { PulseRings } from '../../src/components/shared/PulseRings';
import { Skeleton } from '../../src/components/shared/Skeleton';
import { useAppStore } from '../../src/store/appStore';
import { getCapsules, isLocked, timeUntilUnlock } from '../../src/services/capsule';
import type { Capsule } from '../../src/types';

export default function CapsulesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const [capsules, setCapsules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCapsules(session?.walletAddress).then(c => { setCapsules(c); setLoading(false); });
  }, [session?.walletAddress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Time Capsules</Text>
        <Text style={styles.subtitle}>Secure your digital legacy on Walrus. Messages encrypted in time, waiting for the right moment to emerge.</Text>
      </View>

      {/* Capsule list */}
      <FlatList
        data={capsules}
        keyExtractor={c => c.id}
        numColumns={1}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const locked = isLocked(item);
          return (
            <TouchableOpacity onPress={() => router.push({ pathname: '/capsule-detail', params: { id: item.id } })} activeOpacity={0.8}>
              <GlassPanel style={[styles.card, !locked && styles.cardUnlocked]}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={[styles.cardStatus, !locked && { color: colors.secondary }]}>
                      {locked ? 'LOCKED CAPSULE' : 'STATUS: OPEN'}
                    </Text>
                    <Text style={styles.cardRecipient}>{item.recipientName || 'Capsule'}</Text>
                  </View>
                  <View style={[styles.cardShield, !locked && styles.cardShieldOpen]}>
                    <ShieldCheck size={22} color={!locked ? colors.surface : colors.primary} />
                  </View>
                </View>
                {locked && (
                  <View style={styles.countdownArea}>
                    <View style={styles.countdownLine} />
                    <View style={styles.countdownCenter}>
                      <Text style={styles.countdownText}>{timeUntilUnlock(item)}</Text>
                      <Text style={styles.countdownLabel}>UNLOCKS IN</Text>
                    </View>
                    <View style={styles.countdownLine} />
                  </View>
                )}
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.cardMetaLabel}>CREATED</Text>
                    <Text style={styles.cardMetaValue}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                  </View>
                  {!locked ? (
                    <View style={styles.readBtn}><Text style={styles.readBtnText}>OPEN</Text></View>
                  ) : (
                    <View style={{ alignItems: 'flex-end' as const }}>
                      <Text style={styles.cardMetaLabel}>STORAGE</Text>
                      <Text style={[styles.cardMetaValue, { color: colors.secondary }]}>WALRUS</Text>
                    </View>
                  )}
                </View>
              </GlassPanel>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, opacity: 0.3 }}>◈</Text>
            <Text style={styles.emptyText}>No capsules yet</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-capsule')} activeOpacity={0.8}>
        <PulseRings size={64} color={colors.primary} count={1} />
        <View style={styles.fabInner}>
          <Plus size={28} color={colors.surface} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  headerSection: { marginBottom: spacing.xl },
  title: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primaryContainer, letterSpacing: -1 },
  subtitle: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, lineHeight: 20, marginTop: spacing.sm, maxWidth: 300 },
  list: { gap: spacing.lg, paddingBottom: 120 },

  card: { padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(62,74,75,0.1)' },
  cardUnlocked: { borderColor: 'rgba(143,245,255,0.2)', backgroundColor: 'rgba(143,245,255,0.03)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  cardStatus: { fontSize: typography.sizes.xs, letterSpacing: 3, color: 'rgba(143,245,255,0.6)', marginBottom: 4 },
  cardRecipient: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  cardShield: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  cardShieldOpen: { backgroundColor: colors.primary },

  countdownArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  countdownLine: { flex: 1, height: 1, backgroundColor: 'rgba(62,74,75,0.3)' },
  countdownCenter: { alignItems: 'center' },
  countdownText: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.light, color: colors.primaryContainer, letterSpacing: 3, fontVariant: ['tabular-nums'] },
  countdownLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, marginTop: 2 },

  previewBox: { padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(62,74,75,0.1)', marginBottom: spacing.xl },
  previewText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, fontStyle: 'italic', lineHeight: 20 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: spacing.lg },
  cardMetaLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant },
  cardMetaValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.onSurface, marginTop: 2 },
  readBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primaryContainer, borderRadius: borderRadius.full },
  readBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.surface, letterSpacing: 3 },

  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, letterSpacing: 3, textTransform: 'uppercase' },

  fab: { position: 'absolute', bottom: 100, right: spacing.xl, width: 64, height: 64, borderRadius: 32 },
  fabInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
});
