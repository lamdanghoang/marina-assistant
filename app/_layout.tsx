import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { colors } from '../src/constants/theme';
import { useAppStore } from '../src/store/appStore';
import { loadSession } from '../src/services/auth';

export default function RootLayout() {
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

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
