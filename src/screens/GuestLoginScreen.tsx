import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { CodeIcon, PencilIcon, SearchIcon, BrainIcon, ChevronRightIcon } from '../components/Icons';
import { API_CONFIG } from '../config/api';

interface GuestLoginScreenProps {
  onComplete: (guestData: { username: string; purpose: string; token: string }) => void;
}

const purposes = [
  {
    id: 'coding',
    label: 'Coding',
    description: 'Bantuan programming dan development',
    IconComponent: CodeIcon,
    color: '#3B82F6'
  },
  {
    id: 'copywriter',
    label: 'Copywriting',
    description: 'Menulis konten dan copy',
    IconComponent: PencilIcon,
    color: '#10B981'
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Riset dan pengumpulan informasi',
    IconComponent: SearchIcon,
    color: '#F59E0B'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: 'Analisis data dan problem solving',
    IconComponent: BrainIcon,
    color: '#8B5CF6'
  },
];

export const GuestLoginScreen: React.FC<GuestLoginScreenProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = username.trim().length >= 2 && selectedPurpose !== null;

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/guest/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          purpose: selectedPurpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftar');
      }

      onComplete({
        username: data.guest.username,
        purpose: data.guest.purpose,
        token: data.token,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Gagal mendaftar. Coba lagi.');

      // Fallback: proceed anyway with local data
      setTimeout(() => {
        onComplete({
          username: username.trim(),
          purpose: selectedPurpose!,
          token: 'local_guest_' + Date.now(),
        });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoBg, { backgroundColor: colors.primary + '15' }]}>
            <VortexLogoSimple size={60} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.textPrimary }]}>Vortex AI</Text>
          <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>
            Masukkan nama untuk memulai
          </Text>
        </View>

        {/* Username Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Nama Kamu</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Contoh: Fiqri"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoCapitalize="words"
            />
          </View>
          <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
            Minimal 2 karakter
          </Text>
        </View>

        {/* Purpose Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Mau pakai Vortex untuk apa?</Text>
          <View style={styles.purposeGrid}>
            {purposes.map((purpose) => {
              const isSelected = selectedPurpose === purpose.id;
              return (
                <TouchableOpacity
                  key={purpose.id}
                  style={[
                    styles.purposeCard,
                    {
                      backgroundColor: isSelected ? purpose.color + '15' : colors.surface,
                      borderColor: isSelected ? purpose.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPurpose(purpose.id)}
                >
                  <View style={[styles.purposeIconBg, { backgroundColor: purpose.color + '20' }]}>
                    <purpose.IconComponent size={24} color={purpose.color} />
                  </View>
                  <Text style={[styles.purposeLabel, { color: isSelected ? purpose.color : colors.textPrimary }]}>
                    {purpose.label}
                  </Text>
                  <Text style={[styles.purposeDesc, { color: colors.textTertiary }]}>
                    {purpose.description}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: purpose.color }]}>
                      <Text style={styles.checkmarkText}>v</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isValid ? colors.primary : colors.surfaceSecondary },
          ]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={[styles.submitText, { color: isValid ? '#FFFFFF' : colors.textTertiary }]}>
                Mulai Chat dengan Vortex
              </Text>
              <ChevronRightIcon size={20} color={isValid ? '#FFFFFF' : colors.textTertiary} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBg: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: 'bold' },
  logoSubtext: { fontSize: 15, marginTop: 4 },
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  inputContainer: { borderRadius: 14, borderWidth: 1 },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  inputHint: { fontSize: 12, marginTop: 6, marginLeft: 4 },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  purposeCard: {
    width: '47%', padding: 14, borderRadius: 14, borderWidth: 1.5,
    position: 'relative'
  },
  purposeIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  purposeLabel: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  purposeDesc: { fontSize: 11, lineHeight: 14 },
  checkmark: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  checkmarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  errorContainer: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { fontSize: 13, textAlign: 'center' },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 8
  },
  submitText: { fontSize: 17, fontWeight: '600', marginRight: 8 },
});
