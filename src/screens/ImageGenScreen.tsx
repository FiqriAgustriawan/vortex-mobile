import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { SparkleIcon, BackIcon } from '../components/Icons';
import { generateImage as generateImageApi, checkApiHealth } from '../config/api';
import { Ionicons } from '@expo/vector-icons';

interface ImageGenScreenProps {
  onGoBack: () => void;
}

// Aspect Ratio Options
const aspectRatios = [
  { id: '1:1', label: 'Square', icon: 'square-outline' as const },
  { id: '16:9', label: 'Landscape', icon: 'tablet-landscape-outline' as const },
  { id: '9:16', label: 'Portrait', icon: 'tablet-portrait-outline' as const },
  { id: '4:3', label: 'Standard', icon: 'laptop-outline' as const },
];

// Style Presets - simplified
const stylePresets = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'anime', label: 'Anime' },
  { id: 'artistic', label: 'Artistic' },
  { id: '3d', label: '3D Render' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'minimal', label: 'Minimal' },
];

export const ImageGenScreen: React.FC<ImageGenScreenProps> = ({ onGoBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    // Check connection first
    const online = await checkApiHealth();
    setIsOnline(online);

    if (!online) {
      setError('Tidak bisa terhubung ke server. Pastikan backend aktif.');
      setLoading(false);
      return;
    }

    const result = await generateImageApi(prompt, {
      aspectRatio: selectedAspectRatio,
      style: selectedStyle,
    });

    if (result.success && result.base64) {
      // Set image with base64 data URL
      setGeneratedImage(`data:${result.mimeType};base64,${result.base64}`);
    } else {
      setError(result.error || 'Gagal generate gambar. Coba lagi.');
    }

    setLoading(false);
  };

  const imageHeight = selectedAspectRatio === '16:9' ? 200
    : selectedAspectRatio === '9:16' ? 400
      : selectedAspectRatio === '4:3' ? 280
        : 300;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <BackIcon size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <VortexLogoSimple size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Vortex Imagen</Text>
          </View>
          <Text style={styles.headerSubtitle}>AI Image Generation</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prompt Input */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Deskripsi Gambar</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Contoh: A cute cat playing with a ball..."
            placeholderTextColor={colors.textTertiary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>{prompt.length}/500</Text>
        </View>

        {/* Style Presets */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Gaya Visual</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {stylePresets.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.presetChip,
                {
                  backgroundColor: selectedStyle === style.id ? colors.primary : colors.surface,
                  borderColor: selectedStyle === style.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedStyle(style.id)}
            >
              <Text style={[
                styles.presetText,
                { color: selectedStyle === style.id ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Aspect Ratio */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Aspect Ratio</Text>
        <View style={styles.aspectGrid}>
          {aspectRatios.map((ratio) => (
            <TouchableOpacity
              key={ratio.id}
              style={[
                styles.aspectCard,
                {
                  backgroundColor: selectedAspectRatio === ratio.id ? colors.primary + '15' : colors.surface,
                  borderColor: selectedAspectRatio === ratio.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedAspectRatio(ratio.id)}
            >
              <Ionicons
                name={ratio.icon}
                size={24}
                color={selectedAspectRatio === ratio.id ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.aspectLabel,
                { color: selectedAspectRatio === ratio.id ? colors.primary : colors.textSecondary }
              ]}>
                {ratio.label}
              </Text>
              <Text style={[styles.aspectRatio, { color: colors.textTertiary }]}>{ratio.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            { backgroundColor: prompt.trim() && !loading ? colors.primary : colors.surfaceSecondary }
          ]}
          onPress={handleGenerate}
          disabled={!prompt.trim() || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.generateText}>Generating... (may take 30-60s)</Text>
            </>
          ) : (
            <>
              <SparkleIcon size={20} color={prompt.trim() ? '#FFFFFF' : colors.textTertiary} />
              <Text style={[
                styles.generateText,
                { color: prompt.trim() ? '#FFFFFF' : colors.textTertiary }
              ]}>
                Generate dengan Vortex
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Generated Image */}
        {generatedImage && (
          <View style={styles.resultContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hasil</Text>
            <View style={[styles.imageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image
                source={{ uri: generatedImage }}
                style={[styles.generatedImage, { width: screenWidth - 64, height: imageHeight }]}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={[styles.regenerateButton, { borderColor: colors.primary }]}
              onPress={handleGenerate}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={[styles.regenerateText, { color: colors.primary }]}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backText: { color: '#FFF', fontSize: 15, fontWeight: '500', marginLeft: 4 },
  headerCenter: { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  headerRight: { width: 80 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  inputContainer: { borderRadius: 16, borderWidth: 1, padding: 4 },
  input: { padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', paddingRight: 12, paddingBottom: 8 },
  presetsScroll: { marginHorizontal: -16, paddingHorizontal: 16, marginTop: 4 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  presetText: { fontSize: 14, fontWeight: '500' },
  aspectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  aspectCard: { width: '47%', padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  aspectLabel: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  aspectRatio: { fontSize: 12, marginTop: 2 },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 24 },
  generateText: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#FFFFFF' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginTop: 16 },
  errorText: { fontSize: 14, marginLeft: 8, flex: 1 },
  resultContainer: { marginTop: 16 },
  imageContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 8 },
  generatedImage: { borderRadius: 12 },
  regenerateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  regenerateText: { fontSize: 14, fontWeight: '500', marginLeft: 6 },
  footer: { height: 40 },
});
