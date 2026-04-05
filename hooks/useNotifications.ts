import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/lib/notifications';

export function useNotifications() {
  const router = useRouter();
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Register for push notifications
    registerForPushNotifications(user.id).then((token) => {
      if (token) {
        console.log('Push token registered:', token.slice(0, 20) + '...');
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    // Listen for user tapping on a notification
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;

      if (data?.questId) {
        router.push(`/quest/${data.questId}` as never);
      } else if (data?.screen === 'friends') {
        router.push('/(tabs)/friends' as never);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id, router]);
}
