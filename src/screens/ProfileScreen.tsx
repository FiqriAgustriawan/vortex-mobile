import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import {
  MoonIcon, NotificationIcon, GlobeIcon, StorageIcon, TrashIcon,
  HelpIcon, FeedbackIcon, InfoIcon, SoundIcon, FontSizeIcon, ChevronRightIcon
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
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState(true);
  const [sound, setSound] = React.useState(true);

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

  const displayName = guestData?.username || 'Pengguna';
  const displayPurpose = guestData?.purpose ? purposeLabels[guestData.purpose] : 'Guest';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
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
                  onPress={() => item.type === 'toggle' && handleToggle(item.id)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: 'bold' },
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
});

