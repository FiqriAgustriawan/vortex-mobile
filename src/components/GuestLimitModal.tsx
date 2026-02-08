import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GUEST_MESSAGE_LIMIT } from '../contexts/AuthContext';

interface GuestLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginPress: () => void;
  messageCount: number;
}

/**
 * Modal shown when Guest user reaches their message limit.
 */
export default function GuestLimitModal({
  visible,
  onClose,
  onLoginPress,
  messageCount,
}: GuestLimitModalProps) {
  const { isDark } = useTheme();

  const colors = {
    overlay: 'rgba(0,0,0,0.6)',
    card: isDark ? '#1a1a1a' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#888888' : '#666666',
    primary: '#6366f1',
    warning: '#f59e0b',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Batas Harian Tercapai
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Anda telah menggunakan {messageCount} dari {GUEST_MESSAGE_LIMIT} pesan gratis hari ini.
            {'\n\n'}
            Daftar gratis untuk akses unlimited ke AI, Chat History, Digest, dan fitur lainnya!
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onLoginPress}
            >
              <Text style={styles.buttonText}>Daftar Gratis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
            >
              <Text style={[styles.laterText, { color: colors.textSecondary }]}>
                Nanti Saja
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  laterText: {
    fontSize: 14,
  },
});
