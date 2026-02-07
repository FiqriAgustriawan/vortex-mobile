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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  getDeviceId,
  scheduleTestNotification,
} from '../services/notifications';

// Topic options
const TOPICS = [
  { id: 'technology', label: 'Teknologi', icon: '🔧' },
  { id: 'business', label: 'Bisnis', icon: '💼' },
  { id: 'sports', label: 'Olahraga', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'science', label: 'Sains', icon: '🔬' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'world', label: 'Berita Dunia', icon: '🌍' },
  { id: 'indonesia', label: 'Berita Indonesia', icon: '🇮🇩' },
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
      // Register for push notifications if enabling
      let pushToken = null;
      if (settings.enabled) {
        pushToken = await registerForPushNotifications();
        if (!pushToken) {
          Alert.alert(
            'Notifikasi',
            'Tidak dapat mengaktifkan notifikasi. Pastikan izin notifikasi diaktifkan di pengaturan HP.'
          );
          setSaving(false);
          return;
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

      // Ensure at least one topic is selected
      if (newTopics.length === 0) return prev;
      // Max 5 topics
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fe591b" />
          <Text style={styles.loadingText}>Memuat pengaturan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Digest</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Enable Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.sectionTitle}>Aktifkan Digest</Text>
              <Text style={styles.sectionSubtitle}>Terima rangkuman berita harian</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings((prev) => ({ ...prev, enabled: value }))}
              trackColor={{ false: '#3e3e3e', true: '#fe591b' }}
              thumbColor={settings.enabled ? '#fff' : '#888'}
            />
          </View>
        </View>

        {/* Schedule Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waktu Pengiriman</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowTimeModal(!showTimeModal)}
          >
            <Text style={styles.selectorText}>🕐 {settings.scheduleTime}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showTimeModal && (
            <View style={styles.optionsContainer}>
              <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    style={[
                      styles.optionItem,
                      settings.scheduleTime === time.value && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      setSettings((prev) => ({ ...prev, scheduleTime: time.value }));
                      setShowTimeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        settings.scheduleTime === time.value && styles.optionTextSelected,
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bahasa Digest</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowLanguageModal(!showLanguageModal)}
          >
            <Text style={styles.selectorText}>
              {LANGUAGES.find((l) => l.code === settings.language)?.flag}{' '}
              {LANGUAGES.find((l) => l.code === settings.language)?.label}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showLanguageModal && (
            <View style={styles.optionsContainer}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.optionItem,
                    settings.language === lang.code && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setSettings((prev) => ({ ...prev, language: lang.code }));
                    setShowLanguageModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.language === lang.code && styles.optionTextSelected,
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Topik (max 5)</Text>
          <Text style={styles.sectionSubtitle}>
            Dipilih: {settings.topics.length}/5
          </Text>
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicChip,
                  settings.topics.includes(topic.id) && styles.topicChipSelected,
                ]}
                onPress={() => toggleTopic(topic.id)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text
                  style={[
                    styles.topicLabel,
                    settings.topics.includes(topic.id) && styles.topicLabelSelected,
                  ]}
                >
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Prompt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instruksi Kustom (Opsional)</Text>
          <Text style={styles.sectionSubtitle}>
            Contoh: "Fokus berita startup Indonesia"
          </Text>
          <TextInput
            style={styles.customPromptInput}
            value={settings.customPrompt}
            onChangeText={(text) => setSettings((prev) => ({ ...prev, customPrompt: text }))}
            placeholder="Tulis instruksi tambahan..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Simpan Pengaturan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, saving && styles.buttonDisabled]}
            onPress={testDigest}
            disabled={saving}
          >
            <Text style={styles.testButtonText}>🧪 Test Digest Sekarang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('DigestHistory')}
          >
            <Text style={styles.historyButtonText}>📜 Lihat History Digest</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    color: '#888',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
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
    backgroundColor: '#3a3a3a',
    padding: 14,
    borderRadius: 12,
  },
  selectorText: {
    color: '#fff',
    fontSize: 15,
  },
  selectorArrow: {
    color: '#888',
    fontSize: 12,
  },
  optionsContainer: {
    backgroundColor: '#3a3a3a',
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
    borderBottomColor: '#4a4a4a',
  },
  optionItemSelected: {
    backgroundColor: '#fe591b20',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fe591b',
    fontWeight: '600',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topicChipSelected: {
    backgroundColor: '#fe591b20',
    borderColor: '#fe591b',
  },
  topicIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  topicLabel: {
    color: '#888',
    fontSize: 13,
  },
  topicLabelSelected: {
    color: '#fe591b',
    fontWeight: '600',
  },
  customPromptInput: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#fe591b',
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
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  historyButtonText: {
    color: '#888',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
