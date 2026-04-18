import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <GlassPanel style={styles.section}>
        <SettingItem icon={<Bell size={18} color={colors.primary} />} iconBg="rgba(143,245,255,0.1)" title="Notifications" sub="Push & Alerts" hasArrow />
        <SettingItem icon={<ShieldCheck size={18} color={colors.secondary} />} iconBg="rgba(90,248,251,0.1)" title="Seal Cryptography" sub="Active" toggle />
      </GlassPanel>

      <GlassPanel style={styles.section}>
        <SettingItem title="Language" sub="English" hasArrow />
        <SettingItem title="Voice Response" sub="Enabled" toggle defaultOn />
        <SettingItem title="Network" sub="Testnet" hasArrow />
      </GlassPanel>

      <GlassPanel style={styles.section}>
        <SettingItem title="About Marina" sub="v1.0.0" hasArrow />
        <SettingItem title="Clear Chat History" sub="Remove all messages" danger />
      </GlassPanel>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>DISCONNECT WALLET</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingItem({ icon, iconBg, title, sub, hasArrow, toggle, defaultOn, danger }: {
  icon?: React.ReactNode; iconBg?: string; title: string; sub: string; hasArrow?: boolean; toggle?: boolean; defaultOn?: boolean; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item}>
      {icon && <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, danger && { color: colors.error }]}>{title}</Text>
        <Text style={styles.itemSub}>{sub}</Text>
      </View>
      {hasArrow && <ChevronRight size={16} color={colors.onSurfaceVariant} />}
      {toggle && (
        <View style={[styles.toggle, defaultOn !== false && styles.toggleOn]}>
          <View style={[styles.toggleDot, defaultOn !== false && styles.toggleDotOn]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  section: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.xl },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: 'rgba(62,74,75,0.1)' },
  itemIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  itemSub: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 1, textTransform: 'uppercase' },
  toggle: { width: 48, height: 24, borderRadius: 12, backgroundColor: colors.surfaceContainerHighest, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(160,174,174,0.4)' },
  toggleDotOn: { backgroundColor: colors.surface, alignSelf: 'flex-end', marginRight: 2 },
  logoutBtn: { alignItems: 'center', padding: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,113,108,0.3)', marginTop: spacing.md },
  logoutText: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, letterSpacing: 3 },
});
