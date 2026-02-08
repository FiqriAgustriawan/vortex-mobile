import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../config/api';
import {
  registerForPushNotifications,
  getDeviceId,
} from '../services/notifications';
import {
  BackIcon,
  NewsIcon,
  TechIcon,
  BusinessIcon,
  SportsIcon,
  EntertainmentIcon,
  ScienceIcon,
  GamingIcon,
  WorldIcon,
  IndonesiaIcon,
  SaveIcon,
  TestIcon,
  ReceiptIcon
} from '../components/Icons';
import { useTheme } from '../theme/ThemeContext';

// Topic options with Vector Icons
const TOPICS = [
  { id: 'technology', label: 'Teknologi', Icon: TechIcon },
  { id: 'business', label: 'Bisnis', Icon: BusinessIcon },
  { id: 'sports', label: 'Olahraga', Icon: SportsIcon },
  { id: 'entertainment', label: 'Entertainment', Icon: EntertainmentIcon },
  { id: 'science', label: 'Sains', Icon: ScienceIcon },
  { id: 'gaming', label: 'Gaming', Icon: GamingIcon },
  { id: 'world', label: 'Berita Dunia', Icon: WorldIcon },
  { id: 'indonesia', label: 'Berita Indonesia', Icon: IndonesiaIcon },
];

// Language options
const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

// Time options (every hour)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

interface DigestSettings {
  enabled: boolean;
  scheduleTime: string;
  timezone: string;
  topics: string[];
  customPrompt: string;
  language: string;
}

export default function DigestSettingsScreen({ navigation }: any) {
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DigestSettings>({
    enabled: false,
    scheduleTime: '08:00',
    timezone: 'Asia/Jakarta',
    topics: ['technology'],
    customPrompt: '',
    language: 'id',
  });
  const [userId, setUserId] = useState<string>('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const deviceId = await getDeviceId();
      setUserId(deviceId);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/settings/${deviceId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSettings({
          enabled: result.data.enabled || false,
          scheduleTime: result.data.scheduleTime || '08:00',
          timezone: result.data.timezone || 'Asia/Jakarta',
          topics: result.data.topics || ['technology'],
          customPrompt: result.data.customPrompt || '',
          language: result.data.language || 'id',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      let pushToken = null;
      if (settings.enabled) {
        pushToken = await registerForPushNotifications();
        if (!pushToken) {
          Alert.alert(
            'Perhatian (Mode Expo Go)',
            'Notifikasi push tidak tersedia di mode Expo Go/Simulator. Settings tetap disimpan.',
            [{ text: 'Lanjut Simpan', style: 'default' }]
          );
        }
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...settings,
          pushToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Sukses', 'Pengaturan digest berhasil disimpan!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSettings((prev) => {
      const newTopics = prev.topics.includes(topicId)
        ? prev.topics.filter((t) => t !== topicId)
        : [...prev.topics, topicId];

      if (newTopics.length === 0) return prev;
      if (newTopics.length > 5) {
        Alert.alert('Maksimal 5 Topik', 'Kamu hanya bisa memilih maksimal 5 topik.');
        return prev;
      }
      return { ...prev, topics: newTopics };
    });
  };

  const testDigest = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topics: settings.topics,
          language: settings.language,
          customPrompt: settings.customPrompt,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Test Berhasil!', 'Digest berhasil di-generate. Cek History untuk melihat hasilnya.', [
          { text: 'OK' },
          { text: 'Lihat History', onPress: () => navigation.navigate('DigestHistory') },
        ]);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal generate digest');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat pengaturan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
            <BackIcon size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <NewsIcon size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daily Digest</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Enable Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Aktifkan Digest</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Terima rangkuman berita harian</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings((prev) => ({ ...prev, enabled: value }))}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={settings.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Schedule Time */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Waktu Pengiriman</Text>
          <TouchableOpacity
            style={[styles.selector, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setShowTimeModal(!showTimeModal)}
          >
            <Text style={[styles.selectorText, { color: colors.textPrimary }]}>🕐 {settings.scheduleTime}</Text>
            <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {showTimeModal && (
            <View style={[styles.optionsContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                      settings.scheduleTime === time.value && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => {
                      setSettings((prev) => ({ ...prev, scheduleTime: time.value }));
                      setShowTimeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textPrimary },
                        settings.scheduleTime === time.value && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bahasa Digest</Text>
          <TouchableOpacity
            style={[styles.selector, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setShowLanguageModal(!showLanguageModal)}
          >
            <Text style={[styles.selectorText, { color: colors.textPrimary }]}>
              {LANGUAGES.find((l) => l.code === settings.language)?.flag}{' '}
              {LANGUAGES.find((l) => l.code === settings.language)?.label}
            </Text>
            <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {showLanguageModal && (
            <View style={[styles.optionsContainer, { backgroundColor: colors.surfaceSecondary }]}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    settings.language === lang.code && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => {
                    setSettings((prev) => ({ ...prev, language: lang.code }));
                    setShowLanguageModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.textPrimary },
                      settings.language === lang.code && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {lang.flag} {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Topic Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pilih Topik (max 5)</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Dipilih: {settings.topics.length}/5
          </Text>
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => {
              const isSelected = settings.topics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicChip,
                    { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
                    isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                >
                  <topic.Icon size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                  <Text
                    style={[
                      styles.topicLabel,
                      { color: colors.textSecondary },
                      isSelected && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Prompt */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Instruksi Kustom (Opsional)</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Contoh: "Fokus berita startup Indonesia"
          </Text>
          <TextInput
            style={[styles.customPromptInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }]}
            value={settings.customPrompt}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, customPrompt: text }))}
            placeholder="Tulis instruksi tambahan..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
          />
        </View>



        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
            onPress={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SaveIcon size={20} color="#fff" />
                <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Simpan Pengaturan</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, saving && styles.buttonDisabled]}
            onPress={testDigest}
            disabled={saving}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TestIcon size={20} color="#fff" />
              <Text style={[styles.testButtonText, { marginLeft: 8 }]}>Test Digest Sekarang</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyButton, { backgroundColor: colors.surface, borderColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('DigestHistory')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ReceiptIcon size={20} color={colors.textSecondary} />
              <Text style={[styles.historyButtonText, { color: colors.textSecondary, marginLeft: 8 }]}>Lihat History Digest</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.textTertiary, fontSize: 10 }}>User ID: {userId}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  selectorText: {
    fontSize: 15,
  },
  selectorArrow: {
    fontSize: 12,
  },
  optionsContainer: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  optionsScroll: {
    maxHeight: 200,
  },
  optionItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
  },
  topicLabel: {
    fontSize: 13,
    marginLeft: 6,
  },
  customPromptInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#2a6b2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  historyButtonText: {
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
