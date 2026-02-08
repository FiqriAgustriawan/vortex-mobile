import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../config/api';
import { getDeviceId } from '../services/notifications';
import { BackIcon, ShareIcon, BookIcon, AlertIcon } from '../components/Icons';
import { useTheme } from '../theme/ThemeContext';

interface DigestDetail {
  _id: string;
  title: string;
  content: string;
  topics: string[];
  language: string;
  sources: { title: string; url: string }[];
  sentAt: string;
  readAt?: string;
}

// Topic labels
const TOPIC_LABELS: Record<string, string> = {
  technology: 'Teknologi',
  business: 'Bisnis',
  sports: 'Olahraga',
  entertainment: 'Entertainment',
  science: 'Sains',
  gaming: 'Gaming',
  world: 'Berita Dunia',
  indonesia: 'Berita Indonesia',
};

export default function DigestDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { digestId } = route.params;
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<DigestDetail | null>(null);

  useEffect(() => {
    loadDigest();
  }, []);

  const loadDigest = async () => {
    try {
      const userId = await getDeviceId();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/digest/history/${userId}/${digestId}`
      );
      const result = await response.json();

      if (result.success) {
        setDigest(result.data);
      }
    } catch (error) {
      console.error('Failed to load digest:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shareDigest = async () => {
    if (!digest) return;

    try {
      // Create shareable text (simplified version)
      const shareText = `📰 ${digest.title}\n\n${digest.content.substring(0, 500)}...\n\n📱 Shared from Vortex AI`;

      await Share.share({
        message: shareText,
        title: digest.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const openSource = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL:', url);
    });
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <Text key={index} style={[styles.h1, { color: colors.textPrimary }]}>
            {line.substring(2)}
          </Text>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <Text key={index} style={[styles.h2, { color: colors.primary }]}>
            {line.substring(3)}
          </Text>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={index} style={[styles.h3, { color: colors.textSecondary }]}>
            {line.substring(4)}
          </Text>
        );
      }
      // Horizontal rule
      if (line.startsWith('---')) {
        return <View key={index} style={[styles.hr, { backgroundColor: colors.border }]} />;
      }
      // Bold text (simplified)
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.textPrimary }]}>
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <Text key={i} style={[styles.bold, { color: colors.textPrimary }]}>{part}</Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <View key={index} style={{ height: 8 }} />;
      }
      // Regular paragraph
      return (
        <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
          {line}
        </Text>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat digest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!digest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AlertIcon size={64} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Digest tidak ditemukan</Text>
          <TouchableOpacity
            style={[styles.backButtonLarge, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonLargeText, { color: colors.surface }]}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <BackIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Digest</Text>
        <TouchableOpacity onPress={shareDigest} style={[styles.shareButton, { backgroundColor: colors.surface }]}>
          <ShareIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Meta info */}
        <View style={styles.metaSection}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(digest.sentAt)}</Text>
          <View style={styles.topicsRow}>
            {digest.topics.map((topic) => (
              <View key={topic} style={[styles.topicBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.topicBadgeText, { color: colors.primary }]}>
                  {TOPIC_LABELS[topic] || topic}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentSection, { backgroundColor: colors.surface }]}>
          {renderMarkdown(digest.content)}
        </View>

        {/* Sources */}
        {digest.sources && digest.sources.length > 0 && (
          <View style={[styles.sourcesSection, { backgroundColor: colors.surface }]}>
            <View style={styles.sourcesHeader}>
              <BookIcon size={20} color={colors.textPrimary} />
              <Text style={[styles.sourcesTitle, { color: colors.textPrimary, marginLeft: 8 }]}>Sumber</Text>
            </View>
            {digest.sources.map((source, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.sourceItem, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => openSource(source.url)}
              >
                <Text style={[styles.sourceTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {source.title}
                </Text>
                <Text style={[styles.sourceUrl, { color: colors.primary }]} numberOfLines={1}>
                  {new URL(source.url).hostname}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    marginTop: 20,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonLargeText: {
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  metaSection: {
    marginBottom: 20,
    marginTop: 20,
  },
  dateText: {
    fontSize: 13,
    marginBottom: 12,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  hr: {
    height: 1,
    marginVertical: 16,
  },
  sourcesSection: {
    borderRadius: 16,
    padding: 16,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sourceItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sourceTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  sourceUrl: {
    fontSize: 12,
  },
});
