import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplets, Copy, Send, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { Skeleton } from '../src/components/shared/Skeleton';
import { useAppStore } from '../src/store/appStore';
import { sendSui } from '../src/services/wallet';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const balance = useAppStore((s) => s.balance);
  const setBalance = useAppStore((s) => s.setBalance);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const addr = session?.walletAddress ?? '';

  const refresh = () => {
    setBalance(null as any);
    import('../src/services/wallet').then(({ getBalance }) => getBalance(addr).then(setBalance));
  };

  const handleSend = () => {
    const amount = parseFloat(sendAmount);
    if (!sendTo.trim() || isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter valid address and amount'); return; }
    Alert.alert('Confirm', `Send ${amount} SUI to ${sendTo.slice(0, 8)}...?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(true);
        const r = await sendSui(sendTo.trim(), amount, addr);
        setSending(false);
        if (r.success) { Alert.alert('Success', `TX: ${r.digest}`); setSendTo(''); setSendAmount(''); setShowSend(false); refresh(); }
        else Alert.alert('Error', r.error ?? 'Transaction failed');
      }},
    ]);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
      </View>
      <GlassPanel style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <View style={styles.balanceRow}>
          <Droplets size={28} color={colors.primary} />
          {balance ? <Text style={styles.balanceValue}>{balance} SUI</Text> : <Skeleton width={160} height={36} />}
        </View>
        <Text style={styles.address} selectable>{addr}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>TESTNET</Text></View>
      </GlassPanel>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => setShowSend(!showSend)}><Send size={20} color={colors.surface} /><Text style={[styles.actionLabel, { color: colors.surface }]}>Send</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={refresh}><RefreshCw size={20} color={colors.primary} /><Text style={styles.actionLabel}>Refresh</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { import('expo-clipboard').then(({ setStringAsync }) => setStringAsync(addr).then(() => Alert.alert('Copied', addr))).catch(() => Alert.alert('Address', addr)); }}><Copy size={20} color={colors.primary} /><Text style={styles.actionLabel}>Copy</Text></TouchableOpacity>
      </View>
      {showSend && (
        <GlassPanel style={styles.sendForm}>
          <Text style={styles.sendTitle}>SEND SUI</Text>
          <TextInput style={styles.input} placeholder="Recipient address (0x...)" placeholderTextColor={colors.onSurfaceVariant + '66'} value={sendTo} onChangeText={setSendTo} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={colors.onSurfaceVariant + '66'} value={sendAmount} onChangeText={setSendAmount} keyboardType="decimal-pad" />
          <TouchableOpacity style={[styles.actionPrimary, { paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center' }]} onPress={handleSend} disabled={sending}>
            <Text style={{ color: colors.surface, fontWeight: typography.weights.bold, letterSpacing: 2, fontSize: typography.sizes.sm }}>{sending ? 'SENDING...' : 'CONFIRM SEND'}</Text>
          </TouchableOpacity>
        </GlassPanel>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  balanceCard: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  balanceLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balanceValue: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primaryContainer },
  address: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, fontFamily: 'monospace' },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHighest, borderWidth: 1, borderColor: colors.glassBorder },
  badgeText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.bold, letterSpacing: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.glassBorder },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase' },
  sendForm: { padding: spacing.xl, marginTop: spacing.xl, gap: spacing.md },
  sendTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.onSurface, letterSpacing: 3, textAlign: 'center' },
  input: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, color: colors.onSurface, fontSize: typography.sizes.md },
});
