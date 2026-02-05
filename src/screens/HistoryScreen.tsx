import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import {
  ChatBubbleIcon, FlashIcon, BrainIcon, CodeIcon,
  TrashIcon, ChevronRightIcon, SparkleIcon
} from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { API_CONFIG } from '../config/api';

interface HistoryScreenProps {
  onNavigateToChat: (params?: { modelId?: string; modelName?: string; conversationId?: string }) => void;
}

interface Conversation {
  _id: string;
  title: string;
  modelId: string;
  modelName: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

const modelIcons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  'vortex-flash': FlashIcon,
  'vortex-pro': BrainIcon,
  'vortex-code': CodeIcon,
};

const modelColors: Record<string, string> = {
  'vortex-flash': '#fe591b',
  'vortex-pro': '#8B5CF6',
  'vortex-code': '#3B82F6',
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateToChat }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        throw new Error('Failed to load');
      }
    } catch (err) {
      console.log('Failed to load conversations:', err);
      setError('Gagal memuat riwayat. Periksa koneksi.');
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleDeletePress = (id: string) => {
    setConversationToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      console.log('Deleting conversation:', conversationToDelete);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversations/${conversationToDelete}`, {
        method: 'DELETE',
      });
      console.log('Delete response:', response.status);
      if (response.ok) {
        setConversations(prev => prev.filter(c => c._id !== conversationToDelete));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteModalVisible(false);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setConversationToDelete(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const IconComponent = modelIcons[item.modelId] || FlashIcon;
    const iconColor = modelColors[item.modelId] || colors.primary;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onNavigateToChat({
          modelId: item.modelId,
          modelName: item.modelName,
          conversationId: item._id
        })}
      >
        <View style={[styles.iconBg, { backgroundColor: iconColor + '15' }]}>
          <IconComponent size={22} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {item.modelName}
            </Text>
            <Text style={[styles.metaDot, { color: colors.textTertiary }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {item.messageCount || 0} pesan
            </Text>
            <Text style={[styles.metaDot, { color: colors.textTertiary }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {formatDate(item.updatedAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeletePress(item._id)}
        >
          <TrashIcon size={18} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
        <ChatBubbleIcon size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Belum Ada Riwayat
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Mulai percakapan baru untuk membuat riwayat
      </Text>
      <TouchableOpacity
        style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
        onPress={() => onNavigateToChat({ modelId: 'vortex-flash', modelName: 'Vortex Flash' })}
      >
        <SparkleIcon size={20} color="#FFFFFF" />
        <Text style={styles.newChatText}>Mulai Chat Baru</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIconBg, { backgroundColor: colors.primary + '15' }]}>
              <VortexLogoSimple size={28} color={colors.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Riwayat Chat</Text>
          </View>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={() => onNavigateToChat({ modelId: 'vortex-flash', modelName: 'Vortex Flash' })}
          >
            <SparkleIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {conversations.length > 0 && (
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {conversations.length} percakapan tersimpan
          </Text>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuat riwayat...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={loadConversations}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Hapus Percakapan"
        message="Apakah Anda yakin ingin menghapus percakapan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDanger={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  newBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  countText: { fontSize: 14, marginTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { padding: 16 },
  emptyListContent: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  iconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12 },
  metaDot: { marginHorizontal: 6 },
  deleteBtn: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  newChatText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
