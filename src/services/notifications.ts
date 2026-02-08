// Push Notification Service for Vortex AI
// Uses expo-notifications for push notifications

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';

// Storage keys
const PUSH_TOKEN_KEY = '@vortex_push_token';
const USER_ID_KEY = '@vortex_device_id';

export interface NotificationData {
  type: string;
  digestId?: string;
  screen?: string;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications
 * @returns Expo push token or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check if it's a physical device
  if (!Device.isDevice) {
    console.log('⚠️ Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('❌ EAS Project ID not found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('✅ Push token obtained:', token);

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('digest', {
        name: 'Daily Digest',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#fe591b',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return token;
  } catch (error) {
    console.error('❌ Failed to get push token:', error);
    return null;
  }
}

/**
 * Get the stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Register push token with our backend
 */
export async function registerTokenWithBackend(userId: string, pushToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, pushToken }),
    });

    const result = await response.json();
    console.log('📤 Token registered with backend:', result.success);
    return result.success === true;
  } catch (error) {
    console.error('Failed to register token with backend:', error);
    return false;
  }
}

/**
 * Set up notification response listener (when user taps notification)
 */
export function setupNotificationResponseListener(
  onNavigate: (screen: string, params: Record<string, any>) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as NotificationData;
    
    console.log('📲 Notification tapped:', data);

    if (data.screen) {
      onNavigate(data.screen, { digestId: data.digestId });
    } else if (data.digestId) {
      onNavigate('DigestDetail', { digestId: data.digestId });
    }
  });

  return () => subscription.remove();
}

/**
 * Set up listener for when app receives notification while in foreground
 */
export function setupNotificationReceivedListener(
  onReceive: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification.request.content.title);
    onReceive(notification);
  });

  return () => subscription.remove();
}

/**
 * Schedule a local test notification
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Notification',
      body: 'Ini adalah test notifikasi dari Vortex AI!',
      data: { type: 'test' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
  console.log('📤 Test notification scheduled');
}

/**
 * Show a local notification immediately
 */
export async function showLocalNotification(title: string, body: string, data: any = {}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
}

/**
 * Get or create a device ID for guest users
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(USER_ID_KEY);
    
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem(USER_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch {
    return `temp-${Date.now()}`;
  }
}

/**
 * Check if push notifications are available
 */
export function isPushNotificationsAvailable(): boolean {
  return Device.isDevice;
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    console.error('Failed to clear badge count');
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
