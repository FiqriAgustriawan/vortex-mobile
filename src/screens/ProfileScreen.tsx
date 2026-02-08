import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Alert, Platform, NativeModules, DevSettings, Image, ActivityIndicator, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import * as ImagePicker from 'expo-image-picker';
import {
  MoonIcon, NotificationIcon, GlobeIcon, StorageIcon, TrashIcon, LogoutIcon,
  HelpIcon, FeedbackIcon, InfoIcon, SoundIcon, FontSizeIcon, ChevronRightIcon, EditIcon
} from '../components/Icons';

interface SettingItem {
  id: string;
  label: string;
  type: 'toggle' | 'link';
  value?: string;
  IconComponent: React.FC<{ size?: number; color?: string }>;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

interface ProfileScreenProps {
  guestData?: {
    username: string;
    purpose: string;
    token: string;
  } | null;
}

const settingsGroups: SettingGroup[] = [
  {
    title: 'Tampilan',
    items: [
      { id: 'darkmode', IconComponent: MoonIcon, label: 'Mode Gelap', type: 'toggle' },
      { id: 'fontsize', IconComponent: FontSizeIcon, label: 'Ukuran Font', type: 'link', value: 'Sedang' },
    ],
  },
  {
    title: 'Notifikasi',
    items: [
      { id: 'notifications', IconComponent: NotificationIcon, label: 'Push Notifications', type: 'toggle' },
      { id: 'sound', IconComponent: SoundIcon, label: 'Suara Notifikasi', type: 'toggle' },
    ],
  },
  {
    title: 'Umum',
    items: [
      { id: 'language', IconComponent: GlobeIcon, label: 'Bahasa', type: 'link', value: 'Indonesia' },
      { id: 'storage', IconComponent: StorageIcon, label: 'Penyimpanan', type: 'link', value: '12.5 MB' },
      { id: 'cache', IconComponent: TrashIcon, label: 'Hapus Cache', type: 'link' },
    ],
  },
  {
    title: 'Bantuan',
    items: [
      { id: 'help', IconComponent: HelpIcon, label: 'Pusat Bantuan', type: 'link' },
      { id: 'feedback', IconComponent: FeedbackIcon, label: 'Kirim Feedback', type: 'link' },
      { id: 'about', IconComponent: InfoIcon, label: 'Tentang Aplikasi', type: 'link' },
      { id: 'logout', IconComponent: LogoutIcon, label: 'Keluar', type: 'link' },
    ],
  },
];

// Purpose labels
const purposeLabels: Record<string, string> = {
  'coding': 'Coding',
  'copywriter': 'Copywriting',
  'research': 'Research',
  'analysis': 'Analysis',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ guestData }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { user, isGuest, signOut, updateAvatar, updateUsername, getProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const [resetModalVisible, setResetModalVisible] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = React.useState(false);
  const [username, setUsername] = React.useState<string>('');
  const [usernameModalVisible, setUsernameModalVisible] = React.useState(false);
  const [newUsernameInput, setNewUsernameInput] = React.useState('');
  const [savingUsername, setSavingUsername] = React.useState(false);

  // Fetch profile on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      if (user && !isGuest) {
        const profile = await getProfile();
        if (profile.username) setUsername(profile.username);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    };
    loadProfile();
  }, [user, isGuest]);

  const getToggleValue = (id: string) => {
    if (id === 'darkmode') return isDarkMode;
    if (id === 'notifications') return notifications;
    if (id === 'sound') return sound;
    return false;
  };

  const handleToggle = (id: string) => {
    if (id === 'darkmode') toggleTheme();
    if (id === 'notifications') setNotifications(!notifications);
    if (id === 'sound') setSound(!sound);
  };

  const handleLogoutPress = () => {
    setResetModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setResetModalVisible(false);
      await signOut();
      // SignOut will redirect to auth screen automatically
    } catch (e) {
      console.error('Logout error:', e);
      Alert.alert('Error', 'Gagal keluar. Silakan coba lagi.');
    }
  };

  const displayName = username || user?.email?.split('@')[0] || guestData?.username || 'Pengguna';
  const displayEmail = user?.email || null;
  const displayPurpose = isGuest ? 'Guest' : (guestData?.purpose ? purposeLabels[guestData.purpose] : 'Member');

  const handleEditUsername = () => {
    if (isGuest) {
      Alert.alert('Tidak Tersedia', 'Login untuk mengubah username');
      return;
    }
    setNewUsernameInput(username);
    setUsernameModalVisible(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsernameInput.trim()) {
      Alert.alert('Error', 'Username tidak boleh kosong');
      return;
    }

    setSavingUsername(true);
    const { success, error } = await updateUsername(newUsernameInput.trim());
    setSavingUsername(false);

    if (success) {
      setUsername(newUsernameInput.trim());
      setUsernameModalVisible(false);
      Alert.alert('Sukses', 'Username berhasil diperbarui!');
    } else {
      Alert.alert('Error', error?.message || 'Gagal memperbarui username');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            await AsyncStorage.clear();
            if (NativeModules.DevSettings) {
              NativeModules.DevSettings.reload();
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    if (isGuest) {
      Alert.alert('Tidak Tersedia', 'Login untuk mengubah foto profil');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarLoading(true);
        const { url, error } = await updateAvatar(result.assets[0].uri);

        if (error) {
          Alert.alert('Error', 'Gagal mengupload foto. Pastikan bucket "avatars" sudah dibuat di Supabase.');
        } else if (url) {
          setAvatarUrl(url);
          Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
        }
        setAvatarLoading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handlePickImage}
          style={[styles.avatarContainer, { backgroundColor: colors.primary }]}
        >
          {avatarLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <EditIcon size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditUsername}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          {!isGuest && (
            <Text style={[styles.editHint, { color: colors.textTertiary }]}>Tap untuk edit username</Text>
          )}
        </TouchableOpacity>
        {displayEmail && (
          <Text style={[styles.email, { color: colors.textSecondary }]}>{displayEmail}</Text>
        )}
        <View style={[styles.purposeBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.purposeText, { color: colors.primary }]}>{displayPurpose}</Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={[styles.statItem, { borderRightColor: colors.border, borderRightWidth: 1 }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Chat</Text>
          </View>
          <View style={[styles.statItem, { borderRightColor: colors.border, borderRightWidth: 1 }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>Vortex Flash</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Model Favorit</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>Hari Ini</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Bergabung</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{group.title}</Text>

            <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index < group.items.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }
                  ]}
                  onPress={() => {
                    if (item.type === 'toggle') handleToggle(item.id);
                    if (item.id === 'logout') handleLogoutPress();
                  }}
                  disabled={item.type === 'toggle'}
                >
                  <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
                    <item.IconComponent size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>

                  {item.type === 'toggle' && (
                    <Switch
                      value={getToggleValue(item.id)}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  )}

                  {item.type === 'link' && (
                    <View style={styles.menuRight}>
                      {item.value && <Text style={[styles.menuValue, { color: colors.textTertiary }]}>{item.value}</Text>}
                      <ChevronRightIcon size={18} color={colors.textTertiary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <VortexLogoSimple size={28} color={colors.textTertiary} />
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>Vortex AI v1.0.0</Text>
          <Text style={[styles.versionSubtext, { color: colors.textTertiary }]}>Made with love by Vortex Team</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={resetModalVisible}
        title="Keluar dari Akun"
        message="Apakah kamu yakin ingin keluar dari akun ini?"
        confirmText="Keluar"
        cancelText="Batal"
        onConfirm={handleConfirmLogout}
        onCancel={() => setResetModalVisible(false)}
        isDanger={true}
      />

      {/* Username Edit Modal */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Username</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Masukkan username baru:
            </Text>
            <TextInput
              style={[styles.usernameInput, {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.border
              }]}
              value={newUsernameInput}
              onChangeText={setNewUsernameInput}
              placeholder="Username"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setUsernameModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveUsername}
                disabled={savingUsername}
              >
                {savingUsername ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  editBadgeText: { fontSize: 12 },
  name: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  email: { fontSize: 14, marginTop: 4 },
  purposeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  purposeText: { fontSize: 14, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', marginTop: 20, borderRadius: 16, padding: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15 },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: 14, marginRight: 4 },
  versionContainer: { alignItems: 'center', marginTop: 8, marginBottom: 32 },
  versionText: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  versionSubtext: { fontSize: 11, marginTop: 4 },
  editHint: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  usernameInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});

