import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { colors } from '../src/constants/theme';
import { useAppStore } from '../src/store/appStore';
import { loadSession } from '../src/services/auth';

export default function RootLayout() {
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const setBalance = useAppStore((s) => s.setBalance);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadSession().then((s) => { setSession(s); setReady(true); });
  }, []);

  // Global balance polling every 15s when app is active
  useEffect(() => {
    if (!session?.walletAddress) return;
    const fetch = () => import('../src/services/wallet').then(({ getBalance }) => getBalance(session.walletAddress).then(setBalance));
    fetch();
    const interval = setInterval(fetch, 15000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') fetch(); });
    return () => { clearInterval(interval); sub.remove(); };
  }, [session?.walletAddress]);

  useEffect(() => {
    loadSession().then((s) => { setSession(s); setReady(true); });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === 'login';
    if (!session && !inAuth) router.replace('/login');
    else if (session && inAuth) router.replace('/(tabs)/home');
  }, [session, ready, segments]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wallet" options={{ presentation: 'card' }} />
      <Stack.Screen name="contacts" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="create-capsule" options={{ presentation: 'card' }} />
      <Stack.Screen name="capsule-detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="tx-history" options={{ presentation: 'card' }} />
    </Stack>
  );
}
