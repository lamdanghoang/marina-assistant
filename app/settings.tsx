import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { useAppStore } from '../src/store/appStore';
import { logout } from '../src/services/auth';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAppStore((s) => s.setVoiceEnabled);
  const [sealEnabled, setSealEnabled] = React.useState(true);
  const [notifEnabled, setNotifEnabled] = React.useState(true);

  const handleLogout = () => Alert.alert('Disconnect', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Disconnect', style: 'destructive', onPress: async () => { await logout(); setSession(null); } },
  ]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <GlassPanel style={styles.section}>
        <View style={styles.item}>
          <View style={[styles.itemIcon, { backgroundColor: 'rgba(143,245,255,0.1)' }]}><Bell size={18} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Notifications</Text><Text style={styles.itemSub}>{notifEnabled ? 'PUSH & ALERTS' : 'DISABLED'}</Text></View>
          <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ true: 'rgba(143,245,255,0.4)', false: colors.surfaceContainerHighest }} thumbColor={'#fff'} ios_backgroundColor={colors.surfaceContainerHighest} />
        </View>
        <View style={styles.item}>
          <View style={[styles.itemIcon, { backgroundColor: 'rgba(90,248,251,0.1)' }]}><ShieldCheck size={18} color={colors.secondary} /></View>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Seal Cryptography</Text><Text style={styles.itemSub}>{sealEnabled ? 'ACTIVE' : 'DISABLED'}</Text></View>
          <Switch value={sealEnabled} onValueChange={setSealEnabled} trackColor={{ true: 'rgba(143,245,255,0.4)', false: colors.surfaceContainerHighest }} thumbColor={'#fff'} ios_backgroundColor={colors.surfaceContainerHighest} />
        </View>
      </GlassPanel>

      <GlassPanel style={styles.section}>
        <View style={styles.item}>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Language</Text><Text style={styles.itemSub}>STT & TTS</Text></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setLanguage('en-US')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: language === 'en-US' ? 'rgba(143,245,255,0.3)' : colors.surfaceContainerHighest }}>
              <Text style={{ color: language === 'en-US' ? colors.primary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLanguage('vi-VN')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: language === 'vi-VN' ? 'rgba(143,245,255,0.3)' : colors.surfaceContainerHighest }}>
              <Text style={{ color: language === 'vi-VN' ? colors.primary : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>VI</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.item}>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Voice Response</Text><Text style={styles.itemSub}>{voiceEnabled ? 'ENABLED' : 'DISABLED'}</Text></View>
          <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} trackColor={{ true: 'rgba(143,245,255,0.4)', false: colors.surfaceContainerHighest }} thumbColor={'#fff'} ios_backgroundColor={colors.surfaceContainerHighest} />
        </View>
        <View style={styles.item}>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Network</Text><Text style={styles.itemSub}>TESTNET</Text></View>
          <ChevronRight size={16} color={colors.onSurfaceVariant} />
        </View>
      </GlassPanel>

    </ScrollView>
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
  itemSub: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 1 },
  logoutBtn: { alignItems: 'center', padding: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,113,108,0.3)' },
  logoutText: { color: colors.error, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, letterSpacing: 3 },
});
