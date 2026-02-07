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
          <Text key={index} style={styles.h1}>
            {line.substring(2)}
          </Text>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <Text key={index} style={styles.h2}>
            {line.substring(3)}
          </Text>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={index} style={styles.h3}>
            {line.substring(4)}
          </Text>
        );
      }
      // Horizontal rule
      if (line.startsWith('---')) {
        return <View key={index} style={styles.hr} />;
      }
      // Bold text (simplified)
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <Text key={index} style={styles.paragraph}>
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <Text key={i} style={styles.bold}>{part}</Text>
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
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fe591b" />
          <Text style={styles.loadingText}>Memuat digest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!digest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😢</Text>
          <Text style={styles.errorText}>Digest tidak ditemukan</Text>
          <TouchableOpacity
            style={styles.backButtonLarge}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonLargeText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digest</Text>
        <TouchableOpacity onPress={shareDigest} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Meta info */}
        <View style={styles.metaSection}>
          <Text style={styles.dateText}>{formatDate(digest.sentAt)}</Text>
          <View style={styles.topicsRow}>
            {digest.topics.map((topic) => (
              <View key={topic} style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>
                  {TOPIC_LABELS[topic] || topic}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {renderMarkdown(digest.content)}
        </View>

        {/* Sources */}
        {digest.sources && digest.sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <Text style={styles.sourcesTitle}>📚 Sumber</Text>
            {digest.sources.map((source, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sourceItem}
                onPress={() => openSource(source.url)}
              >
                <Text style={styles.sourceTitle} numberOfLines={2}>
                  {source.title}
                </Text>
                <Text style={styles.sourceUrl} numberOfLines={1}>
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
    backgroundColor: '#1a1a1a',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
  },
  backButtonLarge: {
    backgroundColor: '#fe591b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonLargeText: {
    color: '#fff',
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  metaSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: '#fe591b20',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  topicBadgeText: {
    color: '#fe591b',
    fontSize: 12,
    fontWeight: '600',
  },
  contentSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fe591b',
    marginBottom: 12,
    marginTop: 16,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 24,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#fff',
  },
  hr: {
    height: 1,
    backgroundColor: '#3a3a3a',
    marginVertical: 16,
  },
  sourcesSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sourceItem: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sourceTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  sourceUrl: {
    fontSize: 12,
    color: '#fe591b',
  },
});
