import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { Skeleton } from '../src/components/shared/Skeleton';
import { useAppStore } from '../src/store/appStore';
import { getTransactionHistory, TxRecord } from '../src/services/wallet';

export default function TxHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.walletAddress) getTransactionHistory(session.walletAddress, 20).then(t => { setTxs(t); setLoading(false); });
  }, [session?.walletAddress]);

  const TxIcon = ({ type }: { type: string }) => {
    if (type === 'Send') return <ArrowUpRight size={20} color={colors.primary} />;
    if (type === 'Receive') return <ArrowDownLeft size={20} color={colors.secondary} />;
    return <RefreshCw size={20} color={colors.primary} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>
      {loading ? (
        <View style={{ gap: spacing.md }}>{[1,2,3,4,5].map(i => <Skeleton key={i} width="100%" height={64} borderRadius={16} />)}</View>
      ) : (
        <FlatList data={txs} keyExtractor={t => t.digest} contentContainerStyle={{ paddingBottom: 100, gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => Linking.openURL(`https://suiscan.xyz/testnet/tx/${item.digest}`)}>
              <GlassPanel style={styles.txCard}>
                <View style={styles.txIcon}><TxIcon type={item.txType} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txType}>{item.txType}</Text>
                  <Text style={styles.txTime}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' as const }}>
                  <Text style={[styles.txStatus, item.status === 'SUCCESS' && styles.txStatusOk]}>{item.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'}</Text>
                  <Text style={styles.txGas}>{item.gasFee} SUI</Text>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  txCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  txIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  txType: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  txTime: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  txGas: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginTop: 4 },
  txStatus: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 0, color: colors.error },
  txStatusOk: { color: colors.success },
  empty: { textAlign: 'center', color: colors.onSurfaceVariant, marginTop: 40 },
});
