import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { VORTEX_MODELS } from '../config/api';
import {
  FlashIcon, BrainIcon, CodeIcon, SparkleIcon,
  ArrowRightIcon, LightbulbIcon, PencilIcon, SearchIcon, TerminalIcon,
  ChevronRightIcon, ImageGenIcon
} from '../components/Icons';

interface HomeScreenProps {
  onNavigateToChat: (params?: { modelId?: string; modelName?: string }) => void;
  onNavigateToImageGen?: () => void;
  guestName?: string;
}

// Map icon components to models
const modelIcons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  'vortex-flash': FlashIcon,
  'vortex-pro': BrainIcon,
  'vortex-code': CodeIcon,
};

// Badge colors
const badgeColors: Record<string, string> = {
  'Fastest': '#10B981',
  'Recommended': '#fe591b',
  'Coder': '#3B82F6',
};

// Quick Prompts
const quickPrompts = [
  { id: '1', label: 'Buat kode', IconComponent: TerminalIcon },
  { id: '2', label: 'Debug error', IconComponent: SearchIcon },
  { id: '3', label: 'Jelaskan konsep', IconComponent: LightbulbIcon },
  { id: '4', label: 'Review code', IconComponent: PencilIcon },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChat, onNavigateToImageGen, guestName }) => {
  const { colors } = useTheme();
  const { user, isGuest, getProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string>(guestName || 'Developer');

  // Fetch user profile for displayname
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (user && !isGuest) {
        const profile = await getProfile();
        if (profile.username) {
          setDisplayName(profile.username);
        } else if (user.user_metadata?.username) {
          setDisplayName(user.user_metadata.username);
        } else if (user.email) {
          setDisplayName(user.email.split('@')[0]);
        }
      } else if (guestName) {
        setDisplayName(guestName);
      }
    };
    fetchDisplayName();
  }, [user, isGuest, guestName, getProfile]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIconBg, { backgroundColor: colors.primary + '15' }]}>
              <VortexLogoSimple size={36} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.logoText, { color: colors.textPrimary }]}>Vortex AI</Text>
              <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>Your Coding Assistant</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.online + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.online }]} />
            <Text style={[styles.statusText, { color: colors.online }]}>Ready</Text>
          </View>
        </View>

        <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
          Halo, {displayName}!
        </Text>
        <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
          Siap membantu coding, analisis, dan penalaran
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Start */}
        <TouchableOpacity
          style={[styles.quickStartCard, { backgroundColor: colors.primary }]}
          onPress={() => onNavigateToChat({ modelId: 'vortex-flash', modelName: 'Vortex Flash' })}
        >
          <View style={styles.quickStartContent}>
            <View style={styles.quickStartIconBg}>
              <SparkleIcon size={28} color="#FFFFFF" />
            </View>
            <View style={styles.quickStartInfo}>
              <Text style={styles.quickStartTitle}>Mulai Coding</Text>
              <Text style={styles.quickStartDesc}>Tanyakan tentang code, error, atau konsep</Text>
            </View>
          </View>
          <View style={styles.quickStartArrowBg}>
            <ArrowRightIcon size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* AI Image Generation */}
        {onNavigateToImageGen && (
          <TouchableOpacity
            style={[styles.imageGenCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            onPress={onNavigateToImageGen}
          >
            <View style={styles.quickStartContent}>
              <View style={[styles.imageGenIconBg, { backgroundColor: '#8B5CF6' + '20' }]}>
                <ImageGenIcon size={24} color="#8B5CF6" />
              </View>
              <View style={styles.quickStartInfo}>
                <Text style={[styles.imageGenTitle, { color: colors.textPrimary }]}>Generate Gambar AI</Text>
                <Text style={[styles.imageGenDesc, { color: colors.textSecondary }]}>Buat gambar dengan AI</Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Quick Prompts */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
          {quickPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              style={[styles.promptChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={() => onNavigateToChat({ modelId: 'vortex-flash', modelName: 'Vortex Flash' })}
            >
              <prompt.IconComponent size={16} color={colors.primary} />
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>{prompt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Models */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pilih Asisten</Text>

        {VORTEX_MODELS.map((model) => {
          const IconComponent = modelIcons[model.id] || FlashIcon;
          const badgeColor = badgeColors[model.badge] || colors.primary;

          return (
            <TouchableOpacity
              key={model.id}
              style={[styles.modelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onNavigateToChat({ modelId: model.id, modelName: model.name })}
            >
              <View style={[styles.modelIconBg, { backgroundColor: badgeColor + '15' }]}>
                <IconComponent size={26} color={badgeColor} />
              </View>
              <View style={styles.modelInfo}>
                <View style={styles.modelHeader}>
                  <Text style={[styles.modelName, { color: colors.textPrimary }]}>{model.name}</Text>
                  <View style={[styles.modelBadge, { backgroundColor: badgeColor + '15' }]}>
                    <Text style={[styles.modelBadgeText, { color: badgeColor }]}>{model.badge}</Text>
                  </View>
                </View>
                <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>{model.description}</Text>
                <View style={styles.capabilitiesRow}>
                  {model.capabilities.slice(0, 2).map((cap, i) => (
                    <View key={i} style={[styles.capTag, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.capText, { color: colors.textTertiary }]}>{cap}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <ChevronRightIcon size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIconBg: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { fontSize: 22, fontWeight: 'bold' },
  logoSubtext: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  welcomeText: { fontSize: 28, fontWeight: 'bold' },
  welcomeSubtext: { fontSize: 15, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  quickStartCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  quickStartContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  quickStartIconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  quickStartInfo: { flex: 1 },
  quickStartTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  quickStartDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  quickStartArrowBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  promptsScroll: { marginBottom: 24, marginHorizontal: -16, paddingHorizontal: 16 },
  promptChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  promptText: { fontSize: 14, marginLeft: 8 },
  modelCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  modelIconBg: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  modelInfo: { flex: 1 },
  modelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modelName: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  modelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modelBadgeText: { fontSize: 10, fontWeight: '600' },
  modelDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  capabilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  capTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  capText: { fontSize: 10 },
  footer: { height: 20 },
  imageGenCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1 },
  imageGenIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  imageGenTitle: { fontSize: 16, fontWeight: '600' },
  imageGenDesc: { fontSize: 12, marginTop: 2 },
});
