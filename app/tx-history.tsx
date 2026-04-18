import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { TRANSACTIONS } from '../src/constants/data';

export default function TxHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const TxIcon = ({ type }: { type: string }) => {
    if (type === 'sent') return <ArrowUpRight size={22} color={colors.primary} />;
    if (type === 'received') return <ArrowDownLeft size={22} color={colors.secondary} />;
    return <RefreshCw size={22} color={colors.primary} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Ledger</Text>
      </View>
      <FlatList
        data={TRANSACTIONS}
        keyExtractor={t => t.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GlassPanel style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={styles.txIcon}><TxIcon type={item.type} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <View style={styles.txMeta}>
                  <Text style={styles.txDate}>{item.date}</Text>
                  <Text style={[styles.txStatus, (item.status === 'confirmed' || item.status === 'success') && { color: colors.secondary }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.txAmount, item.type === 'received' && { color: colors.secondary }]}>{item.amount}</Text>
            </View>
          </GlassPanel>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  txCard: { padding: spacing.xl },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  txIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.onSurface },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  txDate: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant },
  txStatus: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 2, color: colors.onSurfaceVariant },
  txAmount: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.onSurface },
});
