import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  featureName?: string;
  onLoginPress?: () => void;
}

/**
 * Wraps a component and shows a login prompt if user is not authenticated.
 * Guest users will see a message explaining they need to login.
 */
export default function ProtectedRoute({
  children,
  featureName = 'Fitur ini',
  onLoginPress
}: ProtectedRouteProps) {
  const { user, isGuest } = useAuth();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? '#0f0f0f' : '#f5f5f5',
    card: isDark ? '#1a1a1a' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#888888' : '#666666',
    primary: '#6366f1',
  };

  // If user is authenticated (not guest), show the content
  if (user && !isGuest) {
    return <>{children}</>;
  }

  // Show login required message
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Login Diperlukan
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {featureName} hanya tersedia untuk pengguna terdaftar.
          {isGuest && '\n\nAnda sedang menggunakan mode Tamu dengan akses terbatas.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onLoginPress}
        >
          <Text style={styles.buttonText}>Masuk atau Daftar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 320,
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
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
