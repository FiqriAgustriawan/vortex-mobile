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
import {
  BackIcon,
  SettingsIcon,
  TechIcon,
  BusinessIcon,
  SportsIcon,
  EntertainmentIcon,
  ScienceIcon,
  GamingIcon,
  WorldIcon,
  IndonesiaIcon,
  NewsIcon
} from '../components/Icons';
import { useTheme } from '../theme/ThemeContext';

interface DigestItem {
  _id: string;
  title: string;
  content: string;
  topics: string[];
  language: string;
  sentAt: string;
  readAt?: string;
}

// Topic icons mapping with React Components
const TOPIC_ICON_COMPONENTS: Record<string, React.FC<any>> = {
  technology: TechIcon,
  business: BusinessIcon,
  sports: SportsIcon,
  entertainment: EntertainmentIcon,
  science: ScienceIcon,
  gaming: GamingIcon,
  world: WorldIcon,
  indonesia: IndonesiaIcon,
};

export default function DigestHistoryScreen({ navigation }: any) {
  const { colors } = useTheme();
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
      style={[
        styles.digestCard,
        { backgroundColor: colors.surface },
        !item.readAt && { borderLeftWidth: 3, borderLeftColor: colors.primary }
      ]}
      onPress={() => navigation.navigate('DigestDetail', { digestId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.topicsRow}>
          {item.topics.slice(0, 3).map((topic) => {
            const IconComponent = TOPIC_ICON_COMPONENTS[topic] || NewsIcon;
            return (
              <View key={topic} style={{ marginRight: 8 }}>
                <IconComponent size={16} color={colors.primary} />
              </View>
            );
          })}
          {item.topics.length > 3 && (
            <Text style={[styles.moreBadge, { color: colors.textSecondary }]}>+{item.topics.length - 3}</Text>
          )}
        </View>
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(item.sentAt)}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={[styles.cardPreview, { color: colors.textSecondary }]} numberOfLines={2}>
        {getPreview(item.content)}
      </Text>

      {!item.readAt && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <NewsIcon size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Belum Ada Digest</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Aktifkan Daily Digest di Settings untuk mulai menerima rangkuman berita harian
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('DigestSettings')}
      >
        <Text style={[styles.emptyButtonText, { color: colors.surface }]}>Buka Settings</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat history...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Digest History</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DigestSettings')}
          style={[styles.settingsButton, { backgroundColor: colors.surface }]}
        >
          <SettingsIcon size={24} color={colors.textPrimary} />
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  digestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
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
  },
  moreBadge: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontWeight: '600',
  },
});
