import { Platform } from 'react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, type Event } from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';
import { useNotificationStore } from '@/store/notificationStore';

export type VidoraNotification = FirebaseMessagingTypes.RemoteMessage;
export type VidoraNotificationResponse = Event;

const DEFAULT_CHANNEL_ID = 'default';

async function ensureDefaultChannel() {
  if (Platform.OS !== 'android') return DEFAULT_CHANNEL_ID;

  return notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: 'Default',
    importance: AndroidImportance.HIGH,
  });
}

async function displayForegroundNotification(message: FirebaseMessagingTypes.RemoteMessage) {
  await ensureDefaultChannel();

  await notifee.displayNotification({
    title: message.notification?.title,
    body: message.notification?.body,
    data: message.data,
    android: {
      channelId: DEFAULT_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (DeviceInfo.isEmulatorSync()) return null;

  const authorizationStatus = await messaging().requestPermission();
  const enabled =
    authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  await ensureDefaultChannel();
  const token = await messaging().getToken();
  useNotificationStore.getState().setPushToken(token);
  return token;
}

export function addNotificationListeners(
  onReceive?: (notification: VidoraNotification) => void,
  onResponse?: (response: VidoraNotificationResponse) => void,
) {
  const unsubscribeForegroundMessage = messaging().onMessage(async (message) => {
    onReceive?.(message);
    await displayForegroundNotification(message);
  });
  const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((message) => {
    onReceive?.(message);
  });
  const unsubscribeForegroundEvent = notifee.onForegroundEvent((event) => {
    if (event.type === EventType.PRESS) {
      onResponse?.(event);
    }
  });

  return () => {
    unsubscribeForegroundMessage();
    unsubscribeOpenedApp();
    unsubscribeForegroundEvent();
  };
}
