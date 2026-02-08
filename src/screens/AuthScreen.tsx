import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { CodeIcon, PencilIcon, SearchIcon, BrainIcon, ChevronRightIcon, CheckIcon } from '../components/Icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface AuthScreenProps {
  onGuestContinue?: () => void;
}

// Purpose/Role options (same as GuestLoginScreen)
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

type AuthStep = 'auth' | 'profile';

export default function AuthScreen({ onGuestContinue }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithMagicLink, continueAsGuest } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      // For Expo Go, we need to use the correct redirect format
      const redirectUrl = makeRedirectUri({
        scheme: 'vortexai',
        path: 'auth/callback',
        // Use native for standalone apps, not in Expo Go
        native: 'vortexai://auth/callback',
      });

      console.log('OAuth Redirect URL:', redirectUrl); // Debug log

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('Auth result:', result.type); // Debug log

        if (result.type === 'success') {
          const url = result.url;
          console.log('Redirect URL received:', url); // Debug log

          // Parse tokens from URL - check both hash and query params
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // Try hash first (implicit flow)
          if (url.includes('#')) {
            const hashParams = new URLSearchParams(url.split('#')[1]);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }

          // Try query params if hash didn't work
          if (!accessToken && url.includes('?')) {
            const queryParams = new URLSearchParams(url.split('?')[1]);
            accessToken = queryParams.get('access_token');
            refreshToken = queryParams.get('refresh_token');
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;
            // Success! Auth state will update automatically
          } else {
            console.log('No tokens found in URL');
            Alert.alert('Info', 'Login berhasil, silakan refresh app');
          }
        } else if (result.type === 'cancel') {
          console.log('User cancelled');
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', error.message || 'Gagal login dengan Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert('Login Gagal', error.message);
        }
        // On successful login, auth state change will navigate automatically
      } else {
        // For register, move to profile step first
        setStep('profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Nama harus diisi');
      return;
    }

    if (!selectedPurpose) {
      Alert.alert('Error', 'Pilih tujuan penggunaan');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        Alert.alert('Register Gagal', error.message);
        setStep('auth'); // Go back to auth step
      } else {
        Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan login.');
        setIsLogin(true);
        setStep('auth');
        // Reset fields
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    onGuestContinue?.();
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Masukkan email untuk Magic Link');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setMagicLinkSent(true);
        Alert.alert(
          'Magic Link Terkirim! 🪄',
          `Cek inbox email ${email} dan klik link untuk login secara otomatis.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Profile Step - Name & Role Selection
  if (step === 'profile') {
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
            <Text style={[styles.logoText, { color: colors.textPrimary }]}>Lengkapi Profil</Text>
            <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>
              Masukkan nama dan tujuan penggunaan
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Nama Lengkap</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Contoh: Fiqri Agustriawan"
                placeholderTextColor={colors.textTertiary}
                value={fullName}
                onChangeText={setFullName}
                maxLength={50}
                autoCapitalize="words"
              />
            </View>
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
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: (fullName.trim() && selectedPurpose) ? colors.primary : colors.surfaceSecondary },
            ]}
            onPress={handleCompleteProfile}
            disabled={!fullName.trim() || !selectedPurpose || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={[styles.submitText, { color: (fullName.trim() && selectedPurpose) ? '#FFFFFF' : colors.textTertiary }]}>
                  Buat Akun
                </Text>
                <ChevronRightIcon size={20} color={(fullName.trim() && selectedPurpose) ? '#FFFFFF' : colors.textTertiary} />
              </>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('auth')}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              ← Kembali
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Auth Step - Login/Register
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            {isLogin ? 'Selamat datang kembali!' : 'Buat akun baru'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Konfirmasi Password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitText}>
                {isLogin ? 'Masuk' : 'Lanjut'}
              </Text>
              <ChevronRightIcon size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textTertiary }]}>atau</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleText, { color: colors.textPrimary }]}>
                Lanjutkan dengan Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Switch Auth Mode */}
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {isLogin ? 'Daftar' : 'Masuk'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Guest Option */}
        <TouchableOpacity
          style={[styles.guestButton, { borderColor: colors.border }]}
          onPress={handleGuestMode}
        >
          <Text style={[styles.guestText, { color: colors.textSecondary }]}>
            Lanjutkan sebagai Tamu
          </Text>
          <Text style={[styles.guestNote, { color: colors.textTertiary }]}>
            (Akses terbatas: 5 pesan AI/hari)
          </Text>
        </TouchableOpacity>

        {/* Magic Link Option - Only for Login */}
        {isLogin && (
          <TouchableOpacity
            style={[styles.magicLinkButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleMagicLink}
            disabled={loading || magicLinkSent}
          >
            <Text style={[styles.magicLinkText, { color: colors.primary }]}>
              {magicLinkSent ? '📧 Cek Email Kamu' : '🪄 Login tanpa Password (Magic Link)'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBg: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: 'bold' },
  logoSubtext: { fontSize: 15, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  inputContainer: { borderRadius: 14, borderWidth: 1 },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
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
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 8
  },
  submitText: { fontSize: 17, fontWeight: '600', marginRight: 8, color: '#FFFFFF' },
  switchButton: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14 },
  guestButton: {
    alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 14,
    borderStyle: 'dashed', marginTop: 24
  },
  guestText: { fontSize: 14 },
  guestNote: { fontSize: 12, marginTop: 4 },
  backButton: { alignItems: 'center', marginTop: 20 },
  backText: { fontSize: 14 },
  magicLinkButton: {
    alignItems: 'center', padding: 14, borderRadius: 14, marginTop: 16
  },
  magicLinkText: { fontSize: 14, fontWeight: '600' },
  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 20
  },
  divider: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 13 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 10
  },
  googleText: { fontSize: 15, fontWeight: '500' },
});
