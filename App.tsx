import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { HomeIcon, HistoryIcon, ProfileIcon, ImageGenIcon } from './src/components/Icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ImageGenScreen } from './src/screens/ImageGenScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { GuestLoginScreen } from './src/screens/GuestLoginScreen';
import { CookieConsentPopup } from './src/components/CookieConsentPopup';

// Storage keys
const STORAGE_KEYS = {
  HAS_ONBOARDED: '@vortex_has_onboarded',
  GUEST_DATA: '@vortex_guest_data',
};

// Screen types
type Screen = 'home' | 'history' | 'profile' | 'chat' | 'imagegen';
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
  onTabPress
}: {
  activeTab: Screen;
  onTabPress: (tab: Screen) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home' as Screen, label: 'Explore', Icon: HomeIcon },
    { id: 'imagegen' as Screen, label: 'Imagen', Icon: ImageGenIcon },
    { id: 'history' as Screen, label: 'Riwayat', Icon: HistoryIcon },
    { id: 'profile' as Screen, label: 'Profil', Icon: ProfileIcon },
  ];

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
  const [appState, setAppState] = useState<AppState>('loading');
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [chatParams, setChatParams] = useState<{ modelId?: string; modelName?: string; conversationId?: string }>({});

  // Check initial state
  useEffect(() => {
    checkInitialState();
  }, []);

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
        setGuestData(JSON.parse(storedGuestData));
        setAppState('main');
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

  // Login
  if (appState === 'login') {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <GuestLoginScreen onComplete={handleLoginComplete} />
      </>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigateToChat={navigateToChat} guestName={guestData?.username} />;
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
      default:
        return <HomeScreen onNavigateToChat={navigateToChat} guestName={guestData?.username} />;
    }
  };

  // Show tab bar on main screens
  const showTabBar = !['chat'].includes(currentScreen);

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
        <TabBar activeTab={currentScreen} onTabPress={setCurrentScreen} />
      )}

      {/* Cookie Consent Popup - shows once */}
      <CookieConsentPopup />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
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
