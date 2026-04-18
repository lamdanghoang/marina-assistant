import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Droplets, Database, ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronRight, Bell, ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { GlassPanel } from '../../src/components/shared/GlassPanel';
import { useAppStore } from '../../src/store/appStore';
import { logout } from '../../src/services/auth';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const [balance, setBalance] = useState('--');

  useEffect(() => {
    if (session?.walletAddress) {
      import('../../src/services/wallet').then(({ getBalance }) => getBalance(session.walletAddress).then(setBalance));
    }
  }, [session?.walletAddress]);

  const truncAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

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
        <View style={styles.avatarFrame}>
          <View style={styles.avatarInner}>
            <Text style={{ fontSize: 40 }}>🧑‍🚀</Text>
          </View>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.agentLabel}>AUTHENTICATED AGENT</Text>
          <Text style={styles.agentName}>{truncAddr(session?.walletAddress ?? '')}</Text>
          <Text style={styles.agentDesc}>Synchronized with Sui Testnet. Auth: {session?.authMethod ?? 'unknown'}.</Text>
        </View>
      </GlassPanel>

      {/* Portfolio + Stats row */}
      <View style={styles.statsRow}>
        <GlassPanel style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <View>
              <Text style={styles.sectionLabel}>TOTAL PORTFOLIO VALUE</Text>
              <Text style={styles.portfolioValue}>{balance} SUI</Text>
            </View>
            <TouchableOpacity>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.tokenList}>
            <PortfolioItem icon={<Droplets size={18} color={colors.primary} />} title="Sui" sub="SUI Network" amount="12.50 SUI" fiat="≈ $18.45" />
            <PortfolioItem icon={<Database size={18} color={colors.primary} />} title="Walrus" sub="WAL Storage" amount="4,200 WAL" fiat="≈ $2,100" />
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
        {TRANSACTIONS.slice(0, 3).map((tx, i) => (
          <View key={tx.id} style={[styles.txRow, i > 0 && styles.txBorder]}>
            <View style={styles.txIcon}>
              {tx.type === 'sent' ? <ArrowUpRight size={20} color={colors.primary} /> : tx.type === 'received' ? <ArrowDownLeft size={20} color={colors.secondary} /> : <RefreshCw size={20} color={colors.primary} />}
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, tx.type === 'received' && { color: colors.secondary }]}>{tx.amount}</Text>
          </View>
        ))}
      </GlassPanel>

      {/* Contacts + System Config */}
      <View style={styles.bottomGrid}>
        <View style={styles.bottomCol}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <TouchableOpacity onPress={() => router.push('/contacts')}>
              <Text style={styles.viewAllText}>MANAGE</Text>
            </TouchableOpacity>
          </View>
          <GlassPanel style={styles.contactList}>
            {CONTACTS.slice(0, 3).map(c => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactAvatar}><Text style={{ fontSize: 14 }}>{c.name[0]}</Text></View>
                <Text style={styles.contactName}>{c.name}</Text>
              </View>
            ))}
          </GlassPanel>
        </View>

        <View style={styles.bottomCol}>
          <Text style={[styles.sectionTitle, { marginBottom: spacing.md, marginLeft: 4 }]}>System Config</Text>
          <GlassPanel style={styles.configList}>
            <TouchableOpacity style={styles.configItem}>
              <View style={[styles.configIcon, { backgroundColor: 'rgba(143,245,255,0.1)' }]}>
                <Bell size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configTitle}>Notifications</Text>
                <Text style={styles.configSub}>PUSH & ALERTS</Text>
              </View>
              <ChevronRight size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.configItem}>
              <View style={[styles.configIcon, { backgroundColor: 'rgba(90,248,251,0.1)' }]}>
                <ShieldCheck size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configTitle}>Seal Cryptography</Text>
                <Text style={styles.configSub}>ACTIVE</Text>
              </View>
              <View style={styles.toggle}><View style={styles.toggleDot} /></View>
            </TouchableOpacity>
          </GlassPanel>
        </View>
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
  agentName: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface, marginTop: 4 },
  agentDesc: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },

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
});
