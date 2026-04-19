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
  const [pqEnabled, setPqEnabled] = React.useState(false);
  const [pqLoading, setPqLoading] = React.useState(false);

  // Load PQ state on mount
  React.useEffect(() => {
    if (session?.walletAddress) {
      import('../src/services/pq-crypto').then(({ hasLocalPQKey }) => hasLocalPQKey().then(setPqEnabled));
      import('expo-secure-store').then(s => s.getItemAsync(`marina_pq_enabled_${session.walletAddress.slice(0, 10)}`).then(v => setPqEnabled(v === '1')));
    }
  }, [session?.walletAddress]);

  const handlePqToggle = async (value: boolean) => {
    if (!session?.walletAddress) return;
    if (value) {
      const { hasLocalPQKey, queryPQPublicKey } = await import('../src/services/pq-crypto');
      const hasLocal = await hasLocalPQKey();
      const hasOnChain = await queryPQPublicKey(session.walletAddress);

      if (hasLocal && hasOnChain) {
        // Both exist — just enable
        setPqEnabled(true);
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync(`marina_pq_enabled_${session.walletAddress.slice(0, 10)}`, '1');
        return;
      }

      if (!hasLocal && hasOnChain) {
        // On-chain exists but local secret lost
        Alert.alert(
          'PQ Key Conflict',
          'A PQ key exists on-chain but the local secret key is missing. Revoke old key and create a new one?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Revoke & Recreate', style: 'destructive', onPress: async () => {
              setPqLoading(true);
              try {
                const { revokePQKey, generatePQKeypair, savePQKeypair, registerPQKeyOnChain } = await import('../src/services/pq-crypto');
                await revokePQKey(session.walletAddress);
                const { publicKey, secretKey } = await generatePQKeypair();
                await savePQKeypair(publicKey, secretKey);
                await registerPQKeyOnChain(publicKey, session.walletAddress);
                setPqEnabled(true);
                const SecureStore = await import('expo-secure-store');
                await SecureStore.setItemAsync(`marina_pq_enabled_${session.walletAddress.slice(0, 10)}`, '1');
                Alert.alert('Success', 'New PQ key created and registered.');
              } catch (e: any) { Alert.alert('Error', e.message); }
              finally { setPqLoading(false); }
            }},
          ]
        );
        return;
      }

      // No key anywhere — create new
      Alert.alert(
        'Post-Quantum Setup',
        'Generate ML-KEM keypair and register on-chain? (~0.01 SUI gas)',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Setup', onPress: async () => {
            setPqLoading(true);
            try {
              const { generatePQKeypair, savePQKeypair, registerPQKeyOnChain } = await import('../src/services/pq-crypto');
              const { publicKey, secretKey } = await generatePQKeypair();
              await savePQKeypair(publicKey, secretKey);
              await registerPQKeyOnChain(publicKey, session.walletAddress);
              setPqEnabled(true);
              const SecureStore = await import('expo-secure-store');
              await SecureStore.setItemAsync(`marina_pq_enabled_${session.walletAddress.slice(0, 10)}`, '1');
              Alert.alert('Success', 'Post-Quantum key registered on-chain.');
            } catch (e: any) { Alert.alert('Error', e.message); }
            finally { setPqLoading(false); }
          }},
        ]
      );
      return;
    } else {
      setPqEnabled(false);
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(`marina_pq_enabled_${session.walletAddress.slice(0, 10)}`, value ? '1' : '0');
  };

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
        <View style={styles.item}>
          <View style={[styles.itemIcon, { backgroundColor: 'rgba(168,130,255,0.1)' }]}><ShieldCheck size={18} color={'#a882ff'} /></View>
          <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Post-Quantum (ML-KEM)</Text><Text style={styles.itemSub}>{pqLoading ? 'REGISTERING KEY...' : pqEnabled ? 'ACTIVE' : 'DISABLED'}</Text></View>
          <Switch value={pqEnabled} onValueChange={handlePqToggle} disabled={pqLoading} trackColor={{ true: 'rgba(168,130,255,0.4)', false: colors.surfaceContainerHighest }} thumbColor={'#fff'} ios_backgroundColor={colors.surfaceContainerHighest} />
        </View>
        {pqEnabled && (
          <TouchableOpacity style={[styles.item, { borderColor: 'rgba(255,113,108,0.2)' }]} onPress={() => {
            Alert.alert('Revoke PQ Key', 'This will destroy your on-chain PQ key and delete local keys. Capsules encrypted with PQ will become undecryptable. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Revoke', style: 'destructive', onPress: async () => {
                setPqLoading(true);
                try {
                  const { revokePQKey } = await import('../src/services/pq-crypto');
                  await revokePQKey(session!.walletAddress);
                  setPqEnabled(false);
                  const SecureStore = await import('expo-secure-store');
                  await SecureStore.setItemAsync(`marina_pq_enabled_${session!.walletAddress.slice(0, 10)}`, '0');
                  Alert.alert('Done', 'PQ key revoked and destroyed.');
                } catch (e: any) { Alert.alert('Error', e.message); }
                finally { setPqLoading(false); }
              }},
            ]);
          }}>
            <View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.error }]}>Revoke PQ Key</Text><Text style={styles.itemSub}>DESTROY KEY IF COMPROMISED</Text></View>
          </TouchableOpacity>
        )}
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

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: 'rgba(255,60,50,0.2)', borderColor: 'rgba(255,60,50,0.6)' }]} onPress={() => {
        Alert.alert('Reset App', 'Are you sure to reset app? This will delete ALL local data and sign you out. This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: async () => {
            const SecureStore = await import('expo-secure-store');
            const addr = session?.walletAddress?.slice(0, 10) || '';
            const keys = [
              `marina_contacts_${addr}`, `marina_language_${addr}`, `marina_voice_${addr}`,
              `marina_pq_enabled_${addr}`, `marina_pq_sk_${addr}`, `marina_pq_pk_${addr}`,
            ];
            await Promise.all(keys.map(k => SecureStore.deleteItemAsync(k).catch(() => {})));
            await logout();
            setSession(null);
          }},
        ]);
      }}>
        <Text style={styles.logoutText}>RESET APP</Text>
      </TouchableOpacity>

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
