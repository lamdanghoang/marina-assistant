import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Droplets, Database, ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronRight, Bell, ShieldCheck, Copy, Settings } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { GlassPanel } from '../../src/components/shared/GlassPanel';
import { Skeleton } from '../../src/components/shared/Skeleton';
import { useAppStore } from '../../src/store/appStore';
import { logout } from '../../src/services/auth';
import type { Contact } from '../../src/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const balance = useAppStore((s) => s.balance);
  const setBalance = useAppStore((s) => s.setBalance);
  const [txs, setTxs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const loadData = useCallback(() => {
    if (session?.walletAddress) {
      if (!balance) {
        import('../../src/services/wallet').then(({ getBalance }) => getBalance(session.walletAddress).then(setBalance));
      }
      import('../../src/services/wallet').then(({ getTransactionHistory }) =>
        getTransactionHistory(session.walletAddress, 3).then((t) => { setTxs(t); setLoadingTx(false); })
      );
      import('../../src/services/contacts').then(({ getContacts }) => getContacts(session.walletAddress).then(setContacts));
    }
  }, [session?.walletAddress]);

  useFocusEffect(loadData);

  useEffect(() => {
    if (session?.walletAddress) {
      import('../../src/services/wallet').then(({ getBalance }) => getBalance(session.walletAddress).then(setBalance));
    }
  }, [session?.walletAddress]);

  const truncAddr = (a: string) => a ? `${a.slice(0, 5)}...${a.slice(-5)}` : '';

  const handleLogout = () => {
    Alert.alert('Disconnect', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: async () => { await logout(); setSession(null); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Avatar card */}
      <GlassPanel style={styles.avatarCard}>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Settings size={18} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarInner}>
            <Text style={{ fontSize: 40 }}>🧑‍🚀</Text>
          </View>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.agentLabel}>WALLET ADDRESS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
            <Text style={styles.agentName} selectable>{truncAddr(session?.walletAddress ?? '')}</Text>
            <TouchableOpacity onPress={() => { import('expo-clipboard').then(({ setStringAsync }) => setStringAsync(session?.walletAddress ?? '').then(() => Alert.alert('Copied'))).catch(() => {}); }}>
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.authBadge}>
            <Text style={styles.authBadgeText}>{session?.authMethod === 'zklogin' ? '🔐 zkLogin' : '🔑 Wallet'}</Text>
          </View>
        </View>
      </GlassPanel>

      {/* Portfolio + Stats row */}
      <View style={styles.statsRow}>
        <GlassPanel style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <View>
              <Text style={styles.sectionLabel}>TOTAL PORTFOLIO VALUE</Text>
              <Text style={styles.portfolioValue}>{balance ?? ''}</Text>
              {!balance && <Skeleton width={180} height={40} borderRadius={8} />}
            </View>
            <TouchableOpacity>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.tokenList}>
            <PortfolioItem icon={<Droplets size={18} color={colors.primary} />} title="Sui" sub="SUI Network" amount={`${balance} SUI`} fiat="" />
          </View>
        </GlassPanel>
      </View>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/tx-history')} style={styles.viewAll}>
          <Text style={styles.viewAllText}>VIEW ALL</Text>
          <ChevronRight size={12} color={colors.primaryContainer} />
        </TouchableOpacity>
      </View>
      <GlassPanel style={styles.txList}>
        {loadingTx ? (
          <View style={{ padding: spacing.xl, gap: spacing.md }}>
            <Skeleton width="100%" height={48} />
            <Skeleton width="100%" height={48} />
            <Skeleton width="80%" height={48} />
          </View>
        ) : txs.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : txs.map((tx: any, i: number) => (
          <TouchableOpacity key={tx.digest || i} style={[styles.txRow, i > 0 && styles.txBorder]} onPress={() => tx.digest && Linking.openURL(`https://suiscan.xyz/testnet/tx/${tx.digest}`)}>
            <View style={styles.txIcon}>
              {tx.txType === 'Send' ? <ArrowUpRight size={20} color={colors.primary} /> : tx.txType === 'Receive' ? <ArrowDownLeft size={20} color={colors.secondary} /> : <RefreshCw size={20} color={colors.primary} />}
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>{tx.txType}</Text>
              <Text style={styles.txDate}>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : ''}</Text>
            </View>
            <Text style={[styles.txAmount, tx.txType === 'Receive' && { color: colors.secondary }]}>-{tx.gasFee} SUI</Text>
          </TouchableOpacity>
        ))}
      </GlassPanel>

      {/* Contacts & Files */}
      <View style={styles.bottomGrid}>
        <View style={styles.bottomCol}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <TouchableOpacity onPress={() => router.push('/contacts')}>
              <Text style={styles.viewAllText}>MANAGE</Text>
            </TouchableOpacity>
          </View>
          <GlassPanel style={styles.contactList}>
            {contacts.length === 0 ? (
              <Text style={styles.emptyText}>No contacts yet</Text>
            ) : contacts.slice(0, 3).map(c => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactAvatar}><Text style={{ fontSize: 14, color: colors.primary }}>{c.name[0]}</Text></View>
                <Text style={styles.contactName}>{c.name}</Text>
              </View>
            ))}
          </GlassPanel>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Files on Walrus</Text>
        <TouchableOpacity onPress={() => router.push('/files')}>
          <Text style={styles.viewAllText}>MANAGE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>DISCONNECT WALLET</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PortfolioItem({ icon, title, sub, amount, fiat }: { icon: React.ReactNode; title: string; sub: string; amount: string; fiat: string }) {
  return (
    <View style={styles.portfolioItem}>
      <View style={styles.portfolioItemIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.portfolioItemTitle}>{title}</Text>
        <Text style={styles.portfolioItemSub}>{sub}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' as const }}>
        <Text style={styles.portfolioItemAmount}>{amount}</Text>
        <Text style={styles.portfolioItemFiat}>{fiat}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },

  avatarCard: { padding: spacing.xxl, flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.xl },
  avatarFrame: { width: 80, height: 80, borderRadius: 12, padding: 2, borderWidth: 1, borderColor: colors.primary, transform: [{ rotate: '-3deg' }] },
  avatarInner: { flex: 1, borderRadius: 10, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  avatarInfo: { flex: 1 },
  agentLabel: { fontSize: typography.sizes.xs, letterSpacing: typography.tracking.widest, color: colors.primary, opacity: 0.7, fontWeight: typography.weights.bold },
  agentName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.onSurface, fontFamily: 'monospace' },
  authBadge: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: 'rgba(143,245,255,0.1)', borderWidth: 1, borderColor: 'rgba(143,245,255,0.2)' },
  authBadgeText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.bold, letterSpacing: 1 },

  statsRow: { gap: spacing.lg, marginBottom: spacing.xl },
  portfolioCard: { padding: spacing.xxl },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  portfolioValue: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primaryContainer, marginTop: 4 },
  tokenList: { gap: spacing.lg },
  miniCards: { flexDirection: 'row', gap: spacing.lg },
  miniCard: { flex: 1, padding: spacing.xl },
  miniLabel: { fontSize: typography.sizes.xs, letterSpacing: typography.tracking.wider, color: colors.onSurfaceVariant, fontWeight: typography.weights.bold },
  miniValue: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.sm },
  miniSub: { fontSize: typography.sizes.xs, color: 'rgba(143,245,255,0.6)', marginTop: 2, textTransform: 'uppercase' },

  portfolioItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  portfolioItemIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(143,245,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  portfolioItemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  portfolioItemSub: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant },
  portfolioItemAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  portfolioItemFiat: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingHorizontal: 4 },
  sectionLabel: { fontSize: typography.sizes.xs, letterSpacing: typography.tracking.widest, color: colors.onSurfaceVariant, fontWeight: typography.weights.medium },
  sectionTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.onSurface },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: typography.sizes.xs, color: colors.primaryContainer, fontWeight: typography.weights.bold, letterSpacing: typography.tracking.widest },

  txList: { marginBottom: spacing.xl, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl, gap: spacing.lg },
  txBorder: { borderTopWidth: 1, borderTopColor: 'rgba(62,74,75,0.1)' },
  txIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  txDate: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  txAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },

  bottomGrid: { gap: spacing.xl, marginBottom: spacing.xl },
  bottomCol: {},
  contactList: { padding: spacing.xl, gap: spacing.lg },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },

  configList: { padding: spacing.xl, gap: spacing.lg },
  configItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: 'rgba(62,74,75,0.1)' },
  configIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  configTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  configSub: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, letterSpacing: typography.tracking.widest, marginTop: 1 },
  toggle: { width: 48, height: 24, borderRadius: 12, backgroundColor: colors.primary, padding: 2, justifyContent: 'center', alignItems: 'flex-end' },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surface, marginRight: 2 },
  logoutBtn: { alignItems: 'center', padding: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,113,108,0.3)', marginTop: spacing.md },
  logoutText: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, letterSpacing: 3 },
  settingsBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  emptyText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, textAlign: 'center', padding: spacing.xl },
});
