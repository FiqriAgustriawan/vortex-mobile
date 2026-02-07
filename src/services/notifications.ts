import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Storage keys
const PUSH_TOKEN_KEY = '@vortex_push_token';
const USER_ID_KEY = '@vortex_device_id';

export interface NotificationData {
  type: string;
  digestId?: string;
  screen?: string;
}

/**
 * Register for push notifications and get the Expo push token
 * @returns Expo push token or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if physical device (push notifications don't work in simulator)
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return null;
    }

    // Get the push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Push token obtained:', token.data.substring(0, 30) + '...');
    
    // Store locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);

    // Set up Android-specific notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('digest', {
        name: 'Daily Digest',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FE591B',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
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
 * @param userId The user ID
 * @param pushToken The Expo push token
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
    return result.success === true;
  } catch (error) {
    console.error('Failed to register token with backend:', error);
    return false;
  }
}

/**
 * Set up notification response listener (when user taps notification)
 * @param onNavigate Callback to handle navigation
 */
export function setupNotificationResponseListener(
  onNavigate: (screen: string, params: Record<string, any>) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    
    console.log('📱 Notification tapped:', data);
    
    if (data.type === 'digest' && data.digestId) {
      onNavigate('DigestDetail', { digestId: data.digestId });
    }
  });

  return () => subscription.remove();
}

/**
 * Set up listener for when app receives notification while in foreground
 * @param onReceive Callback to handle notification
 */
export function setupNotificationReceivedListener(
  onReceive: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(onReceive);
  return () => subscription.remove();
}

/**
 * Schedule a local test notification (for debugging)
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📰 Test Digest',
      body: 'This is a test notification from Vortex AI!',
      data: { type: 'test' },
    },
    trigger: { seconds: 2 },
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
