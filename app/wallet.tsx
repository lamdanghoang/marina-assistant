import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplets, Copy, Send, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <GlassPanel style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <View style={styles.balanceRow}>
          <Droplets size={28} color={colors.primary} />
          <Text style={styles.balanceValue}>12.5000 SUI</Text>
        </View>
        <Text style={styles.address} selectable>0x7f3b...92a1</Text>
        <View style={styles.networkBadge}><Text style={styles.networkText}>TESTNET</Text></View>
      </GlassPanel>

      <View style={styles.actions}>
        <ActionBtn icon={<Send size={20} color={colors.surface} />} label="Send" primary />
        <ActionBtn icon={<RefreshCw size={20} color={colors.primary} />} label="Refresh" />
        <ActionBtn icon={<Copy size={20} color={colors.primary} />} label="Copy" />
      </View>
    </ScrollView>
  );
}

function ActionBtn({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, primary && styles.actionBtnPrimary]}>
      {icon}
      <Text style={[styles.actionLabel, primary && { color: colors.surface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  balanceCard: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  balanceLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, fontWeight: typography.weights.medium },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balanceValue: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primaryContainer },
  address: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, fontFamily: 'monospace' },
  networkBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHighest, borderWidth: 1, borderColor: colors.glassBorder },
  networkText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.bold, letterSpacing: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.glassBorder },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase' },
});
