import { Stack } from 'expo-router';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
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
