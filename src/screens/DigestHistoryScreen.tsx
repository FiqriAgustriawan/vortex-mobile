import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../config/api';
import { getDeviceId } from '../services/notifications';

interface DigestItem {
  _id: string;
  title: string;
  content: string;
  topics: string[];
  language: string;
  sentAt: string;
  readAt?: string;
}

// Topic icons mapping
const TOPIC_ICONS: Record<string, string> = {
  technology: '🔧',
  business: '💼',
  sports: '⚽',
  entertainment: '🎬',
  science: '🔬',
  gaming: '🎮',
  world: '🌍',
  indonesia: '🇮🇩',
};

export default function DigestHistoryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digests, setDigests] = useState<DigestItem[]>([]);
  const [userId, setUserId] = useState<string>('');

  const loadDigests = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const deviceId = userId || await getDeviceId();
      if (!userId) setUserId(deviceId);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/digest/history/${deviceId}?limit=50`
      );
      const result = await response.json();

      if (result.success) {
        setDigests(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load digests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDigests();
  }, [loadDigests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDigests(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} menit lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`;
    } else if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getPreview = (content: string) => {
    // Remove markdown headers and get first meaningful text
    const lines = content.split('\n').filter(line =>
      line.trim() && !line.startsWith('#') && !line.startsWith('---')
    );
    const preview = lines.slice(0, 2).join(' ').replace(/\*\*/g, '');
    return preview.length > 120 ? preview.substring(0, 117) + '...' : preview;
  };

  const renderDigestItem = ({ item }: { item: DigestItem }) => (
    <TouchableOpacity
      style={[styles.digestCard, !item.readAt && styles.unreadCard]}
      onPress={() => navigation.navigate('DigestDetail', { digestId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.topicsRow}>
          {item.topics.slice(0, 3).map((topic) => (
            <Text key={topic} style={styles.topicBadge}>
              {TOPIC_ICONS[topic] || '📰'}
            </Text>
          ))}
          {item.topics.length > 3 && (
            <Text style={styles.moreBadge}>+{item.topics.length - 3}</Text>
          )}
        </View>
        <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.cardPreview} numberOfLines={2}>
        {getPreview(item.content)}
      </Text>

      {!item.readAt && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Belum Ada Digest</Text>
      <Text style={styles.emptySubtitle}>
        Aktifkan Daily Digest di Settings untuk mulai menerima rangkuman berita harian
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('DigestSettings')}
      >
        <Text style={styles.emptyButtonText}>Buka Settings</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fe591b" />
          <Text style={styles.loadingText}>Memuat history...</Text>
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
        <Text style={styles.headerTitle}>Digest History</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DigestSettings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={digests}
        renderItem={renderDigestItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fe591b"
            colors={['#fe591b']}
          />
        }
      />
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 18,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  digestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#fe591b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicBadge: {
    fontSize: 16,
  },
  moreBadge: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardPreview: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fe591b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#fe591b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
