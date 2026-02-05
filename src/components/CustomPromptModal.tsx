import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface CustomPromptModalProps {
  visible: boolean;
  onClose: () => void;
  modelId: string;
  modelName: string;
  currentPrompt: string;
  onSave: (prompt: string) => void;
}

const STORAGE_KEY = '@vortex_custom_prompts';

// Preset prompts
const presetPrompts = [
  {
    id: 'coding',
    name: 'Coding Expert',
    prompt: 'Kamu adalah expert programmer yang ahli dalam semua bahasa pemrograman. Berikan kode yang bersih, efisien, dan terdokumentasi dengan baik.',
  },
  {
    id: 'writer',
    name: 'Content Writer',
    prompt: 'Kamu adalah penulis konten profesional. Tulis dengan gaya yang menarik, informatif, dan sesuai dengan target audiens.',
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    prompt: 'Kamu adalah analis data yang ahli. Berikan analisis mendalam, insight yang actionable, dan visualisasi data yang jelas.',
  },
  {
    id: 'teacher',
    name: 'Tutor Sabar',
    prompt: 'Kamu adalah guru yang sabar dan ramah. Jelaskan konsep dengan cara yang mudah dipahami, gunakan analogi, dan berikan contoh praktis.',
  },
];

export const CustomPromptModal: React.FC<CustomPromptModalProps> = ({
  visible,
  onClose,
  modelId,
  modelName,
  currentPrompt,
  onSave,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState(currentPrompt);
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      loadSavedPrompts();
    }
  }, [visible]);

  const loadSavedPrompts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prompts = JSON.parse(stored);
        setSavedPrompts(prompts);
        if (prompts[modelId]) {
          setPrompt(prompts[modelId]);
        }
      }
    } catch (err) {
      console.log('Failed to load prompts:', err);
    }
  };

  const handleSave = async () => {
    try {
      const newPrompts = { ...savedPrompts, [modelId]: prompt };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrompts));
      onSave(prompt);
      onClose();
    } catch (err) {
      console.log('Failed to save prompt:', err);
    }
  };

  const handlePresetSelect = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };

  const handleReset = () => {
    setPrompt(currentPrompt);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            }
          ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                System Prompt
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.saveBtn, { color: colors.primary }]}>Simpan</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Model Info */}
              <View style={[styles.modelInfo, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modelName, { color: colors.textPrimary }]}>
                  {modelName}
                </Text>
                <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>
                  Customize bagaimana AI merespons Anda
                </Text>
              </View>

              {/* Preset Prompts */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Template Cepat
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetsRow}
              >
                {presetPrompts.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handlePresetSelect(preset.prompt)}
                  >
                    <Text style={[styles.presetName, { color: colors.textPrimary }]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Custom Prompt Input */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Custom Prompt
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Tulis system prompt kustom..."
                  placeholderTextColor={colors.textTertiary}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              {/* Character count */}
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {prompt.length} karakter
              </Text>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.error }]}
                onPress={handleReset}
              >
                <Ionicons name="refresh" size={18} color={colors.error} />
                <Text style={[styles.resetText, { color: colors.error }]}>
                  Reset ke Default
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// Hook to get custom prompt for a model
export const useCustomPrompt = (modelId: string, defaultPrompt: string): [string, (p: string) => void] => {
  const [prompt, setPrompt] = useState(defaultPrompt);

  useEffect(() => {
    loadPrompt();
  }, [modelId]);

  const loadPrompt = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prompts = JSON.parse(stored);
        if (prompts[modelId]) {
          setPrompt(prompts[modelId]);
        }
      }
    } catch {
      // Use default
    }
  };

  return [prompt, setPrompt];
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  content: { padding: 20 },
  modelInfo: { padding: 16, borderRadius: 12, marginBottom: 20 },
  modelName: { fontSize: 16, fontWeight: '600' },
  modelDesc: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  presetsRow: { marginBottom: 20, marginHorizontal: -20, paddingHorizontal: 20 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  presetName: { fontSize: 14 },
  inputContainer: { borderRadius: 12, borderWidth: 1, padding: 4 },
  input: { padding: 12, fontSize: 14, lineHeight: 20, minHeight: 150 },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 8, marginBottom: 20 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  resetText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
});
