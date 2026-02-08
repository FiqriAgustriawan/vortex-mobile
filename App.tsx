import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { HomeIcon, HistoryIcon, ProfileIcon, ImageGenIcon, NewsIcon, ChatIcon } from './src/components/Icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ImageGenScreen } from './src/screens/ImageGenScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { GuestLoginScreen } from './src/screens/GuestLoginScreen';
import AuthScreen from './src/screens/AuthScreen';
import { CookieConsentPopup } from './src/components/CookieConsentPopup';
import ProtectedRoute from './src/components/ProtectedRoute';
import GuestLimitModal from './src/components/GuestLimitModal';
import DigestSettingsScreen from './src/screens/DigestSettingsScreen';
import DigestHistoryScreen from './src/screens/DigestHistoryScreen';
import DigestDetailScreen from './src/screens/DigestDetailScreen';
import SocialChatScreen from './src/screens/SocialChatScreen';
import { setupNotificationResponseListener, setupNotificationReceivedListener } from './src/services/notifications';
import { GlobalChatListener } from './src/components/GlobalChatListener';

// Digest Icon Component - Removed in favor of NewsIcon
// const DigestIcon = ({ size, color }: { size: number; color: string; focused?: boolean }) => (
//   <Text style={{ fontSize: size - 2 }}>📰</Text>
// );

// Storage keys
const STORAGE_KEYS = {
  HAS_ONBOARDED: '@vortex_has_onboarded',
  GUEST_DATA: '@vortex_guest_data',
};

// Screen types - now includes digest and social screens
type Screen = 'home' | 'history' | 'profile' | 'chat' | 'imagegen' | 'digestSettings' | 'digestHistory' | 'digestDetail' | 'socialChat';
type AppState = 'loading' | 'onboarding' | 'login' | 'main';

// Guest data type
interface GuestData {
  username: string;
  purpose: string;
  token: string;
}

// Custom Tab Bar Component
function TabBar({
  activeTab,
  onTabPress,
  isGuest
}: {
  activeTab: Screen;
  onTabPress: (tab: Screen) => void;
  isGuest: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // All available tabs (Imagen moved to Explore screen)
  const allTabs = [
    { id: 'home' as Screen, label: 'Explore', Icon: HomeIcon, guestVisible: true },
    { id: 'socialChat' as Screen, label: 'Social', Icon: ChatIcon, guestVisible: false },
    { id: 'digestSettings' as Screen, label: 'Digest', Icon: NewsIcon, guestVisible: false },
    { id: 'history' as Screen, label: 'Riwayat', Icon: HistoryIcon, guestVisible: false },
    { id: 'profile' as Screen, label: 'Profil', Icon: ProfileIcon, guestVisible: true },
  ];

  // Filter tabs based on guest status
  const tabs = isGuest ? allTabs.filter(tab => tab.guestVisible) : allTabs;

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 6,
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
          >
            <View style={[
              styles.tabIconContainer,
              isActive && { backgroundColor: colors.primary + '15' }
            ]}>
              <tab.Icon
                size={22}
                color={isActive ? colors.primary : colors.textTertiary}
                focused={isActive}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isActive ? colors.primary : colors.textTertiary },
              isActive && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Main App Content
function AppContent() {
  const { colors, isDarkMode } = useTheme();
  const { user, isGuest, isLoading: authLoading, session } = useAuth();
  const [appState, setAppState] = useState<AppState>('loading');
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [chatParams, setChatParams] = useState<{ modelId?: string; modelName?: string; conversationId?: string }>({});
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  // Check initial state
  useEffect(() => {
    checkInitialState();
    setupNotifications();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (session || isGuest) {
        // User is authenticated or in guest mode
        if (appState === 'login') {
          setAppState('main');
        }
      } else if (appState === 'main') {
        // User logged out
        setAppState('login');
        setGuestData(null);
        setCurrentScreen('home'); // Reset screen
      }
    }
  }, [session, isGuest, authLoading, appState]);

  const setupNotifications = async () => {
    try {
      // Register for push notifications
      const { registerForPushNotifications, registerTokenWithBackend } = await import('./src/services/notifications');
      const token = await registerForPushNotifications();

      if (token) {
        console.log('📱 Push Token:', token);
        // We'll register the token with backend once we have a guest ID or logged in user
        // For now just storing it locally via the service is enough as it saves to AsyncStorage
      }

      // Setup listeners
      const { setupNotificationReceivedListener, setupNotificationResponseListener } = await import('./src/services/notifications');

      const receivedSubscription = setupNotificationReceivedListener(notification => {
        console.log('🔔 Notification received in foreground:', notification);
      });

      const responseSubscription = setupNotificationResponseListener((screen, params) => {
        // Navigation logic for notification tap
        if (screen === 'DigestDetail') {
          setCurrentScreen('digestDetail');
          setChatParams(params || {});
        } else if (screen === 'DigestSettings') {
          setCurrentScreen('digestSettings');
        }
      });

      return () => {
        receivedSubscription();
        responseSubscription();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const checkInitialState = async () => {
    try {
      const [hasOnboarded, storedGuestData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED),
        AsyncStorage.getItem(STORAGE_KEYS.GUEST_DATA),
      ]);

      if (!hasOnboarded) {
        setAppState('onboarding');
      } else if (!storedGuestData) {
        setAppState('login');
      } else {
        const guest = JSON.parse(storedGuestData);
        setGuestData(guest);
        setAppState('main');

        // Update token with backend if we have a user
        if (guest.token) {
          const { getStoredPushToken, registerTokenWithBackend } = await import('./src/services/notifications');
          const pushToken = await getStoredPushToken();
          if (pushToken) {
            registerTokenWithBackend(guest.username, pushToken);
          }
        }
      }
    } catch (error) {
      console.error('Error checking initial state:', error);
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
      setAppState('login');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      setAppState('login');
    }
  };

  const handleLoginComplete = async (data: GuestData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(data));
      setGuestData(data);
      setAppState('main');
    } catch (error) {
      console.error('Error saving guest data:', error);
      setGuestData(data);
      setAppState('main');
    }
  };

  const navigateToChat = (params?: { modelId?: string; modelName?: string; conversationId?: string }) => {
    setChatParams(params || {});
    setCurrentScreen('chat');
  };

  const goBack = () => {
    setCurrentScreen('home');
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      </View>
    );
  }

  // Onboarding
  if (appState === 'onboarding') {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  // Login - Now uses Supabase AuthScreen
  if (appState === 'login') {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AuthScreen
          onGuestContinue={() => {
            // Guest mode - set minimal guest data for backward compatibility
            const guestDataCompat: GuestData = {
              username: 'Guest',
              purpose: 'Testing',
              token: `guest_${Date.now()}`,
            };
            setGuestData(guestDataCompat);
            setAppState('main');
          }}
        />
      </>
    );
  }

  const renderScreen = () => {
    // Navigation helper for digest screens
    const digestNavigation = {
      navigate: (screen: string, params?: any) => {
        if (screen === 'DigestSettings') setCurrentScreen('digestSettings');
        else if (screen === 'DigestHistory') setCurrentScreen('digestHistory');
        else if (screen === 'DigestDetail') {
          setChatParams(params || {});
          setCurrentScreen('digestDetail');
        }
      },
      goBack: () => {
        if (currentScreen === 'digestDetail') setCurrentScreen('digestHistory');
        else setCurrentScreen('digestSettings');
      },
    };

    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigateToChat={navigateToChat} onNavigateToImageGen={() => setCurrentScreen('imagegen')} guestName={guestData?.username} />;
      case 'imagegen':
        return <ImageGenScreen onGoBack={goBack} />;
      case 'history':
        return <HistoryScreen onNavigateToChat={navigateToChat} />;
      case 'profile':
        return <ProfileScreen guestData={guestData} />;
      case 'chat':
        return (
          <ChatScreen
            modelName={chatParams.modelName}
            conversationId={chatParams.conversationId}
            onGoBack={goBack}
            guestToken={guestData?.token}
          />
        );
      case 'digestSettings':
        return <DigestSettingsScreen navigation={digestNavigation} />;
      case 'digestHistory':
        return <DigestHistoryScreen navigation={digestNavigation} />;
      case 'digestDetail':
        return <DigestDetailScreen navigation={digestNavigation} route={{ params: { digestId: (chatParams as any).digestId } }} />;
      case 'socialChat':
        return <SocialChatScreen onGoBack={goBack} />;
      default:
        return <HomeScreen onNavigateToChat={navigateToChat} guestName={guestData?.username} />;
    }
  };

  // Show tab bar on main screens (hide on chat and digest detail)
  const showTabBar = !['chat', 'digestDetail', 'digestHistory'].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.content}>
        {renderScreen()}
      </View>

      {showTabBar && (
        <TabBar activeTab={currentScreen} onTabPress={setCurrentScreen} isGuest={isGuest} />
      )}

      {/* Cookie Consent Popup - shows once */}
      <CookieConsentPopup />

      {/* Global Chat Listener for Notifications */}
      <GlobalChatListener />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
});
