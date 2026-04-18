import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { useAppStore } from '../src/store/appStore';
import { loginWithSeedPhrase, loginWithNewWallet, loginWithGoogle } from '../src/services/auth';

type Mode = 'select' | 'import' | 'new_wallet';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSession = useAppStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('select');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [newMnemonic, setNewMnemonic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const session = await fn();
      setSession(session);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'import') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.subtitle}>Enter your 12-word seed phrase</Text>
        <TextInput style={styles.textarea} placeholder="word1 word2 word3 ..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={seedPhrase} onChangeText={setSeedPhrase} multiline autoCapitalize="none" />
        <TouchableOpacity style={styles.primaryBtn} onPress={() => handleLogin(() => loginWithSeedPhrase(seedPhrase))} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>CONNECT WALLET</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('select')}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
      </View>
    );
  }

  if (mode === 'new_wallet') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.title}>New Wallet</Text>
        {newMnemonic ? (
          <>
            <Text style={styles.subtitle}>Save this seed phrase securely. You won't see it again.</Text>
            <GlassPanel style={styles.mnemonicCard}><Text style={styles.mnemonicText} selectable>{newMnemonic}</Text></GlassPanel>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/home')}>
              <Text style={styles.primaryBtnText}>I'VE SAVED IT, CONTINUE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleLogin(async () => {
            const result = await loginWithNewWallet();
            setNewMnemonic(result.mnemonic);
            return result;
          })} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>GENERATE WALLET</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setMode('select')}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
      <ShieldCheck size={48} color={colors.primary} />
      <Text style={styles.heroTitle}>Marina</Text>
      <Text style={styles.heroSub}>AI Assistant on Sui Blockchain</Text>

      <View style={styles.options}>
        <TouchableOpacity style={styles.optionBtn} onPress={() => setMode('import')}>
          <Text style={styles.optionText}>Import Seed Phrase</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionBtn} onPress={() => setMode('new_wallet')}>
          <Text style={styles.optionText}>Create New Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => handleLogin(loginWithGoogle)} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>SIGN IN WITH GOOGLE</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.xl },
  heroTitle: { fontSize: 48, fontWeight: typography.weights.bold, color: colors.primaryContainer, letterSpacing: -1 },
  heroSub: { fontSize: typography.sizes.md, color: colors.onSurfaceVariant, marginTop: -8 },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface, alignSelf: 'flex-start' },
  subtitle: { fontSize: typography.sizes.md, color: colors.onSurfaceVariant, alignSelf: 'flex-start' },
  options: { width: '100%', gap: spacing.md, marginTop: spacing.xl },
  optionBtn: { width: '100%', paddingVertical: 18, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' },
  optionText: { color: colors.onSurface, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  primaryBtn: { width: '100%', paddingVertical: 18, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: 'center' },
  primaryBtnText: { color: colors.surface, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, letterSpacing: 3 },
  textarea: { width: '100%', height: 120, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, color: colors.onSurface, fontSize: typography.sizes.md, textAlignVertical: 'top' },
  mnemonicCard: { width: '100%', padding: spacing.xl },
  mnemonicText: { color: colors.primary, fontSize: typography.sizes.lg, lineHeight: 28, textAlign: 'center' },
  backLink: { color: colors.primary, fontSize: typography.sizes.md, marginTop: spacing.md },
});
