import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TouchableWithoutFeedback, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const COOKIE_CONSENT_KEY = 'vortex_cookie_consent';
const COOKIE_CONSENT_SHOWN_KEY = 'vortex_cookie_consent_shown';

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export const CookieConsentPopup: React.FC<CookieConsentProps> = ({
  onAccept,
  onReject,
}) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(100))[0];

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      const hasShown = await AsyncStorage.getItem(COOKIE_CONSENT_SHOWN_KEY);
      if (!hasShown) {
        // First time user - show popup
        setTimeout(() => {
          setVisible(true);
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }, 1000); // Delay 1 second after app load
      }
    } catch (error) {
      console.log('Error checking cookie consent:', error);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      await AsyncStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, 'true');
      closePopup();
      onAccept?.();
    } catch (error) {
      console.log('Error saving cookie consent:', error);
    }
  };

  const handleReject = async () => {
    try {
      await AsyncStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
      await AsyncStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, 'true');
      closePopup();
      onReject?.();
    } catch (error) {
      console.log('Error saving cookie consent:', error);
    }
  };

  const closePopup = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Simpan Data Lokal
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Kami menggunakan penyimpanan lokal untuk menyimpan preferensi Anda dan riwayat percakapan.
            Dengan menerima, Anda membantu kami memberikan pengalaman yang lebih baik.
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success || '#4ADE80'} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Menyimpan riwayat chat
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success || '#4ADE80'} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Mengingat preferensi tema
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success || '#4ADE80'} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Login lebih cepat
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton, { borderColor: colors.border }]}
              onPress={handleReject}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                Tolak
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Terima
              </Text>
            </TouchableOpacity>
          </View>

          {/* Settings Link */}
          <Text style={[styles.settingsText, { color: colors.textTertiary }]}>
            Anda dapat mengubah ini kapan saja di Pengaturan
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Utility functions for cookie consent management
export const getCookieConsent = async (): Promise<'accepted' | 'rejected' | null> => {
  try {
    const value = await AsyncStorage.getItem(COOKIE_CONSENT_KEY);
    return value as 'accepted' | 'rejected' | null;
  } catch {
    return null;
  }
};

export const setCookieConsent = async (value: 'accepted' | 'rejected'): Promise<void> => {
  try {
    await AsyncStorage.setItem(COOKIE_CONSENT_KEY, value);
    await AsyncStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, 'true');
  } catch (error) {
    console.log('Error setting cookie consent:', error);
  }
};

export const resetCookieConsent = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(COOKIE_CONSENT_KEY);
    await AsyncStorage.removeItem(COOKIE_CONSENT_SHOWN_KEY);
  } catch (error) {
    console.log('Error resetting cookie consent:', error);
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  acceptButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
