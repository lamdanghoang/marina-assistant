import * as Notifications from 'expo-notifications';
import type { CapsuleMetadata } from './capsule';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export async function requestPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  return (result as any).status === 'granted';
}

export async function scheduleCapsuleUnlock(capsule: CapsuleMetadata): Promise<void> {
  const unlockTime = new Date(capsule.unlockAt).getTime();
  const now = Date.now();
  if (unlockTime <= now) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `capsule-unlock-${capsule.id}`,
    content: {
      title: '🔓 Capsule unlocked!',
      body: `Capsule for ${capsule.recipientName} is ready to open. Tap to view!`,
      data: { capsuleId: capsule.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(unlockTime) },
  });
}

export async function scheduleCapsuleReceived(senderName: string, capsuleId: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 You received a Time Capsule!',
      body: `${senderName} sent you a Time Capsule.`,
      data: { capsuleId },
    },
    trigger: null, // immediate
  });
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
