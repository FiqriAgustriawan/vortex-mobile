import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Clipboard,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocialChat, useRooms, Message, Room } from '../hooks/useSocialChat';
import { SendIcon, ChevronLeftIcon, PlusIcon, UsersIcon, KeyIcon, SparkleIcon } from '../components/Icons';
import { sendChatMessage, VORTEX_MODELS } from '../config/api';
import Markdown from 'react-native-markdown-display';

// AI Bot constants
const AI_USER_ID = 'vortex-ai-bot';
const AI_TRIGGERS = ['@vortex-flash', '@vortex-pro', '@vortex-code'];

interface SocialChatScreenProps {
  onGoBack?: () => void;
}

export default function SocialChatScreen({ onGoBack }: SocialChatScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  // Digest states
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestTimeRange, setDigestTimeRange] = useState('today');
  const [digestTopic, setDigestTopic] = useState('');
  const [digestNotes, setDigestNotes] = useState('');
  const [selectedDigest, setSelectedDigest] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userId = user?.id || null;
  const { rooms, loading: roomsLoading, createRoom, joinRoomByToken } = useRooms(userId);
  const {
    messages,
    typingUsers,
    onlineUsers,
    loading: messagesLoading,
    sendMessage,
    setTyping
  } = useSocialChat(selectedRoom?.id || null, userId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Detect AI trigger in message
  const detectAiTrigger = (text: string): { modelId: string; query: string } | null => {
    const lowerText = text.toLowerCase();
    for (const trigger of AI_TRIGGERS) {
      if (lowerText.startsWith(trigger)) {
        const modelId = trigger.replace('@', '');
        const query = text.substring(trigger.length).trim();
        if (query.length > 0) {
          return { modelId, query };
        }
      }
    }
    return null;
  };

  // Handle AI response
  const handleAiResponse = async (modelId: string, query: string) => {
    setAiLoading(true);

    // Show AI typing indicator
    const model = VORTEX_MODELS.find(m => m.id === modelId);
    const aiName = model?.name || 'Vortex AI';

    try {
      const result = await sendChatMessage(query, modelId, []);

      if (result.success && result.response) {
        // Format AI response with model name prefix for identification
        const formattedResponse = `🤖 ${aiName}:\n\n${result.response}`;

        // Save AI message to Supabase (will be fetched via realtime)
        await sendMessage(formattedResponse);
      } else {
        Alert.alert('AI Error', result.error || 'Gagal mendapatkan respons AI');
      }
    } catch (error) {
      console.error('AI response error:', error);
      Alert.alert('Error', 'Tidak dapat terhubung ke AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Get mention suggestions (AI models + users in room)
  const getMentionSuggestions = () => {
    const suggestions: { id: string; name: string; type: 'ai' | 'user'; icon?: string }[] = [];

    // Add AI models first
    VORTEX_MODELS.forEach(model => {
      suggestions.push({
        id: model.id,
        name: model.name,
        type: 'ai',
        icon: '✨'
      });
    });

    // Add users from messages (unique users)
    const seenUsers = new Set<string>();
    messages.forEach(msg => {
      if (msg.user_id && msg.user_id !== userId && !seenUsers.has(msg.user_id)) {
        seenUsers.add(msg.user_id);
        const username = msg.profiles?.username || msg.user_id.slice(0, 8);
        // Don't add AI responses as users
        if (!msg.content.startsWith('🤖')) {
          suggestions.push({
            id: msg.user_id,
            name: username,
            type: 'user'
          });
        }
      }
    });

    // Filter by search term
    if (mentionFilter) {
      return suggestions.filter(s =>
        s.name.toLowerCase().includes(mentionFilter.toLowerCase())
      );
    }

    return suggestions;
  };

  // Handle mention selection
  const handleSelectMention = (mention: { id: string; name: string; type: 'ai' | 'user' }) => {
    // Find the @ position and replace with mention
    const lastAtIndex = messageInput.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = messageInput.substring(0, lastAtIndex);
      const mentionText = mention.type === 'ai' ? `@${mention.id} ` : `@${mention.name} `;
      setMessageInput(beforeAt + mentionText);
    }
    setShowMentions(false);
    setMentionFilter('');
  };

  // Time range options for digest
  const timeRangeOptions = [
    { value: 'today', label: 'Hari ini' },
    { value: '3days', label: '3 hari terakhir' },
    { value: 'week', label: 'Minggu ini' },
    { value: 'month', label: 'Bulan ini' },
  ];

  // Handle digest generation
  const handleGenerateDigest = async () => {
    if (!digestTopic.trim()) {
      Alert.alert('Error', 'Masukkan topik berita');
      return;
    }

    setDigestLoading(true);

    const timeLabel = timeRangeOptions.find(t => t.value === digestTimeRange)?.label || 'Hari ini';

    const digestPrompt = `Buat ringkasan berita (news digest) dengan format berikut:

TOPIK: ${digestTopic}
RENTANG WAKTU: ${timeLabel}
${digestNotes ? `KETENTUAN TAMBAHAN: ${digestNotes}` : ''}

Berikan response dalam format JSON VALID (tanpa markdown code block):
{
  "title": "Judul digest yang menarik",
  "summary": "Ringkasan singkat 2-3 kalimat",
  "fullContent": "Konten lengkap dengan berita-berita terkait, minimal 3 berita dengan detail",
  "topic": "${digestTopic}",
  "timeRange": "${timeLabel}"
}

Pastikan JSON valid dan bisa di-parse.`;

    try {
      const result = await sendChatMessage(digestPrompt, 'vortex-flash', []);

      if (result.success && result.response) {
        try {
          // Try to parse JSON from response
          let jsonStr = result.response;
          // Remove markdown code blocks if present
          if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```\n?/g, '');
          }

          const digestData = JSON.parse(jsonStr.trim());

          // Format message with digest prefix
          const digestMessage = `📰 DIGEST:${JSON.stringify(digestData)}`;

          // Send to chat (will be persisted)
          await sendMessage(digestMessage);

          // Reset form
          setShowDigestModal(false);
          setDigestTopic('');
          setDigestNotes('');
          setDigestTimeRange('today');
        } catch (parseError) {
          console.error('Parse error:', parseError);
          // If JSON parse fails, send as regular message
          const fallbackDigest = {
            title: `Digest: ${digestTopic}`,
            summary: result.response.substring(0, 200) + '...',
            fullContent: result.response,
            topic: digestTopic,
            timeRange: timeLabel
          };
          await sendMessage(`📰 DIGEST:${JSON.stringify(fallbackDigest)}`);
          setShowDigestModal(false);
          setDigestTopic('');
          setDigestNotes('');
        }
      } else {
        Alert.alert('Error', result.error || 'Gagal generate digest');
      }
    } catch (error) {
      console.error('Digest error:', error);
      Alert.alert('Error', 'Tidak dapat membuat digest');
    } finally {
      setDigestLoading(false);
    }
  };

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setMessageInput(text);

    // Check for @ mention trigger
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1);
      // Show mentions if @ is at end or followed by partial text (no space yet)
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(afterAt);
      } else {
        setShowMentions(false);
        setMentionFilter('');
      }
    } else {
      setShowMentions(false);
      setMentionFilter('');
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (text.length > 0) {
      setTyping(true, user?.email?.split('@')[0] || 'User');

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false, '');
      }, 2000);
    } else {
      setTyping(false, '');
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim()) return;

    // Check for /digest slash command
    if (messageInput.trim().toLowerCase() === '/digest') {
      setMessageInput('');
      setShowDigestModal(true);
      return;
    }

    const aiTrigger = detectAiTrigger(messageInput);

    try {
      // Send user message first
      await sendMessage(messageInput);
      setMessageInput('');
      setTyping(false, '');

      // If AI was triggered, get AI response
      if (aiTrigger) {
        await handleAiResponse(aiTrigger.modelId, aiTrigger.query);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesan');
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    const room = await createRoom(newRoomName.trim(), true);
    if (room) {
      setNewRoomName('');
      setShowCreateRoom(false);
      // Show invite token
      if (room.invite_token) {
        Alert.alert(
          '🎉 Room Dibuat!',
          `Token undangan: ${room.invite_token.toUpperCase()}\n\nShare token ini agar teman bisa bergabung.`,
          [
            { text: 'Salin Token', onPress: () => Clipboard.setString(room.invite_token!) },
            { text: 'OK' }
          ]
        );
      }
      setSelectedRoom(room);
    }
  };

  const handleJoinByToken = async () => {
    if (!joinToken.trim()) return;

    setJoiningRoom(true);
    const result = await joinRoomByToken(joinToken);
    setJoiningRoom(false);

    if (result.success) {
      Alert.alert('✅ Berhasil!', `Kamu sudah bergabung di room "${result.roomName}"`);
      setJoinToken('');
      setShowJoinRoom(false);
    } else {
      Alert.alert('❌ Gagal', result.error || 'Token tidak valid');
    }
  };

  const handleCopyToken = (token: string) => {
    Clipboard.setString(token.toUpperCase());
    Alert.alert('📋 Disalin!', `Token ${token.toUpperCase()} sudah disalin ke clipboard`);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user_id === userId;
    // Detect AI message by content prefix (since AI responses are saved with user's id)
    const isAiMessage = item.content.startsWith('🤖');
    // Detect Digest message
    const isDigestMessage = item.content.startsWith('📰 DIGEST:');

    // Parse and render digest card
    if (isDigestMessage) {
      try {
        const digestJson = item.content.replace('📰 DIGEST:', '');
        const digestData = JSON.parse(digestJson);

        return (
          <TouchableOpacity
            style={[styles.digestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSelectedDigest(digestData)}
            activeOpacity={0.8}
          >
            <View style={styles.digestHeader}>
              <Text style={styles.digestIcon}>📰</Text>
              <View style={[styles.digestBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.digestBadgeText, { color: colors.primary }]}>{digestData.topic || 'News'}</Text>
              </View>
            </View>
            <Text style={[styles.digestTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {digestData.title}
            </Text>
            <Text style={[styles.digestSummary, { color: colors.textSecondary }]} numberOfLines={3}>
              {digestData.summary}
            </Text>
            <View style={styles.digestFooter}>
              <Text style={[styles.digestTimeRange, { color: colors.textTertiary }]}>
                📅 {digestData.timeRange || 'Hari ini'}
              </Text>
              <Text style={[styles.digestTapHint, { color: colors.primary }]}>
                Tap untuk selengkapnya →
              </Text>
            </View>
            <Text style={[styles.messageTime, { color: colors.textTertiary, marginTop: 8 }]}>
              {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        );
      } catch (e) {
        // If parse fails, render as normal message
        console.error('Digest parse error:', e);
      }
    }

    const username = item.profiles?.username || item.user_id?.slice(0, 8) || 'User';
    const avatarUrl = isAiMessage ? null : item.profiles?.avatar_url;
    const avatarLetter = isAiMessage ? '✨' : username.charAt(0).toUpperCase();
    const avatarColor = isAiMessage ? colors.primary : (isMyMessage ? colors.primary : getAvatarColor(username));

    return (
      <View style={[
        styles.messageRow,
        isMyMessage && !isAiMessage ? styles.myMessageRow : styles.otherMessageRow,
      ]}>
        {/* Avatar for other users and AI */}
        {(!isMyMessage || isAiMessage) && (
          <View style={[
            styles.avatar,
            { backgroundColor: avatarUrl ? 'transparent' : avatarColor },
            isAiMessage && styles.aiAvatar
          ]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : isAiMessage ? (
              <SparkleIcon size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            )}
          </View>
        )}

        <View style={[
          styles.messageContainer,
          isMyMessage && !isAiMessage ? styles.myMessage : styles.otherMessage,
        ]}>
          {(!isMyMessage || isAiMessage) && (
            <Text style={[
              styles.messageSender,
              { color: avatarColor },
              isAiMessage && styles.aiSenderName
            ]}>
              {isAiMessage ? 'Vortex AI' : username}
            </Text>
          )}
          <View style={[
            styles.messageBubble,
            {
              backgroundColor: isAiMessage
                ? colors.surfaceSecondary
                : (isMyMessage ? colors.primary : colors.surface),
              borderColor: isAiMessage
                ? colors.primary
                : (isMyMessage ? colors.primary : colors.border),
              borderWidth: isAiMessage ? 1 : StyleSheet.hairlineWidth,
            }
          ]}>
            {isAiMessage ? (
              <Markdown
                style={{
                  body: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
                  heading1: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
                  heading2: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 6 },
                  heading3: { color: colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginVertical: 4 },
                  code_inline: { backgroundColor: colors.background, color: colors.primary, paddingHorizontal: 4, borderRadius: 4 },
                  code_block: { backgroundColor: colors.background, padding: 10, borderRadius: 8, marginVertical: 8 },
                  fence: { backgroundColor: colors.background, padding: 10, borderRadius: 8, marginVertical: 8 },
                  blockquote: { borderLeftColor: colors.primary, borderLeftWidth: 3, paddingLeft: 10, opacity: 0.8 },
                  bullet_list: { marginVertical: 4 },
                  ordered_list: { marginVertical: 4 },
                  list_item: { marginVertical: 2 },
                  strong: { fontWeight: 'bold' },
                  em: { fontStyle: 'italic' },
                  link: { color: colors.primary },
                  paragraph: { marginVertical: 4 },
                }}
              >
                {item.content}
              </Markdown>
            ) : (
              <Text style={[
                styles.messageText,
                { color: isMyMessage ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {item.content}
              </Text>
            )}
          </View>
          <Text style={[styles.messageTime, { color: colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Avatar for my messages (non-AI) */}
        {isMyMessage && !isAiMessage && (
          <View style={[styles.avatar, { backgroundColor: avatarUrl ? 'transparent' : colors.primary }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Generate consistent color from username
  const getAvatarColor = (name: string) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[styles.roomItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedRoom(item)}
    >
      <View style={[styles.roomIcon, { backgroundColor: colors.primary + '20' }]}>
        <UsersIcon size={24} color={colors.primary} />
      </View>
      <View style={styles.roomInfo}>
        <Text style={[styles.roomName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.roomMeta, { color: colors.textTertiary }]}>
          {item.is_group ? 'Grup' : 'Chat'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Room List View
  if (!selectedRoom) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Social Chat</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setShowJoinRoom(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <KeyIcon size={16} color={colors.primary} />
                <Text style={[styles.headerBtnText, { color: colors.primary }]}>Gabung</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateRoom(true)}
            >
              <PlusIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Room List */}
        {roomsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UsersIcon size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Belum ada room chat
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Tap + untuk membuat room baru
            </Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderRoom}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.roomList}
          />
        )}

        {/* Create Room Modal */}
        <Modal visible={showCreateRoom} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Buat Room Baru
              </Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }]}
                placeholder="Nama room..."
                placeholderTextColor={colors.textTertiary}
                value={newRoomName}
                onChangeText={setNewRoomName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => setShowCreateRoom(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateRoom}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Buat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join Room Modal */}
        <Modal visible={showJoinRoom} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <KeyIcon size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Gabung dengan Token</Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Masukkan token undangan dari teman
              </Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  textAlign: 'center',
                  fontSize: 20,
                  letterSpacing: 4,
                  textTransform: 'uppercase'
                }]}
                placeholder="XXXXXXXX"
                placeholderTextColor={colors.textTertiary}
                value={joinToken}
                onChangeText={setJoinToken}
                autoCapitalize="characters"
                maxLength={8}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => { setShowJoinRoom(false); setJoinToken(''); }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleJoinByToken}
                  disabled={joiningRoom || joinToken.length < 6}
                >
                  {joiningRoom ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Gabung</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Digest Configuration Modal */}
        <Modal visible={showDigestModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                📰 Buat Digest
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Generate ringkasan berita dengan AI
              </Text>

              {/* Time Range Selector */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Rentang Waktu</Text>
              <View style={styles.timeRangeContainer}>
                {timeRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeRangeOption,
                      {
                        backgroundColor: digestTimeRange === option.value ? colors.primary : colors.background,
                        borderColor: digestTimeRange === option.value ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => setDigestTimeRange(option.value)}
                  >
                    <Text style={[
                      styles.timeRangeText,
                      { color: digestTimeRange === option.value ? '#FFFFFF' : colors.textSecondary }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Topic Input */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Topik Berita *</Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }]}
                placeholder="contoh: teknologi, olahraga, bisnis..."
                placeholderTextColor={colors.textTertiary}
                value={digestTopic}
                onChangeText={setDigestTopic}
              />

              {/* Additional Notes */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Ketentuan Tambahan (opsional)</Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  height: 80,
                  textAlignVertical: 'top'
                }]}
                placeholder="contoh: fokus pada berita Indonesia..."
                placeholderTextColor={colors.textTertiary}
                value={digestNotes}
                onChangeText={setDigestNotes}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => {
                    setShowDigestModal(false);
                    setDigestTopic('');
                    setDigestNotes('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleGenerateDigest}
                  disabled={digestLoading || !digestTopic.trim()}
                >
                  {digestLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Generate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Digest Detail Modal */}
        <Modal visible={!!selectedDigest} transparent animationType="slide">
          <View style={[styles.digestDetailContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.digestDetailHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedDigest(null)} style={styles.backButton}>
                <ChevronLeftIcon size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.digestDetailTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedDigest?.title || 'Digest'}
                </Text>
                <Text style={[styles.digestDetailMeta, { color: colors.textTertiary }]}>
                  📅 {selectedDigest?.timeRange || 'Hari ini'} • {selectedDigest?.topic || 'News'}
                </Text>
              </View>
            </View>
            <FlatList
              data={[selectedDigest]}
              keyExtractor={() => 'digest-content'}
              contentContainerStyle={{ padding: 16 }}
              renderItem={() => (
                <View>
                  <View style={[styles.digestDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.digestDetailSectionTitle, { color: colors.textPrimary }]}>📋 Ringkasan</Text>
                    <Text style={[styles.digestDetailSummary, { color: colors.textSecondary }]}>
                      {selectedDigest?.summary}
                    </Text>
                  </View>
                  <View style={[styles.digestDetailCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
                    <Text style={[styles.digestDetailSectionTitle, { color: colors.textPrimary }]}>📰 Konten Lengkap</Text>
                    <Markdown
                      style={{
                        body: { color: colors.textPrimary, fontSize: 15, lineHeight: 24 },
                        heading1: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
                        heading2: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
                        heading3: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
                        paragraph: { marginVertical: 8 },
                        bullet_list: { marginVertical: 8 },
                        ordered_list: { marginVertical: 8 },
                        list_item: { marginVertical: 4 },
                        strong: { fontWeight: 'bold' },
                        em: { fontStyle: 'italic' },
                        link: { color: colors.primary },
                      }}
                    >
                      {selectedDigest?.fullContent || ''}
                    </Markdown>
                  </View>
                </View>
              )}
            />
          </View>
        </Modal>
      </View>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Chat Header */}
      <View style={[styles.chatHeader, {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 10
      }]}>
        <TouchableOpacity onPress={() => setSelectedRoom(null)} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={[styles.chatHeaderTitle, { color: colors.textPrimary }]}>
            {selectedRoom.name}
          </Text>
          <Text style={[styles.onlineStatus, { color: colors.success }]}>
            {onlineUsers.length} online
          </Text>
        </View>
        {selectedRoom.invite_token && (
          <TouchableOpacity
            onPress={() => handleCopyToken(selectedRoom.invite_token!)}
            style={[styles.tokenBadge, { backgroundColor: colors.surfaceSecondary }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <KeyIcon size={12} color={colors.primary} />
              <Text style={[styles.tokenText, { color: colors.primary }]}>
                {selectedRoom.invite_token.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      {messagesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* AI Loading Indicator */}
      {aiLoading && (
        <View style={[styles.typingContainer, { backgroundColor: '#fe591b20' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SparkleIcon size={16} color="#fe591b" />
            <Text style={[styles.typingText, { color: '#fe591b' }]}>
              Vortex AI sedang berpikir...
            </Text>
          </View>
        </View>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <View style={[styles.typingContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            {typingUsers.map(u => u.username).join(', ')} sedang mengetik...
          </Text>
        </View>
      )}

      {/* Mention Suggestions Bar */}
      {showMentions && getMentionSuggestions().length > 0 && (
        <View style={[styles.mentionContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <FlatList
            data={getMentionSuggestions()}
            horizontal={false}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 200 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.mentionItem, { backgroundColor: colors.background }]}
                onPress={() => handleSelectMention(item)}
              >
                <View style={[
                  styles.mentionAvatar,
                  { backgroundColor: item.type === 'ai' ? colors.primary : getAvatarColor(item.name) }
                ]}>
                  {item.type === 'ai' ? (
                    <SparkleIcon size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.mentionAvatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.mentionInfo}>
                  <Text style={[styles.mentionName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.mentionType, { color: colors.textTertiary }]}>
                    {item.type === 'ai' ? 'AI Assistant' : 'Member'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16) + 12
      }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
          placeholder="Ketik pesan... (@ untuk mention)"
          placeholderTextColor={colors.textTertiary}
          value={messageInput}
          onChangeText={handleTextChange}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSend}
          disabled={!messageInput.trim()}
        >
          <SendIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Digest Configuration Modal - Chat View */}
      <Modal visible={showDigestModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                📰 Buat Digest
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Generate ringkasan berita dengan AI
              </Text>

              {/* Time Range Selector */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Rentang Waktu</Text>
              <View style={styles.timeRangeContainer}>
                {timeRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeRangeOption,
                      {
                        backgroundColor: digestTimeRange === option.value ? colors.primary : colors.background,
                        borderColor: digestTimeRange === option.value ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => setDigestTimeRange(option.value)}
                  >
                    <Text style={[
                      styles.timeRangeText,
                      { color: digestTimeRange === option.value ? '#FFFFFF' : colors.textSecondary }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Topic Input */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Topik Berita *</Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }]}
                placeholder="contoh: teknologi, olahraga, bisnis..."
                placeholderTextColor={colors.textTertiary}
                value={digestTopic}
                onChangeText={setDigestTopic}
              />

              {/* Additional Notes */}
              <Text style={[styles.digestLabel, { color: colors.textSecondary }]}>Ketentuan Tambahan (opsional)</Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  height: 80,
                  textAlignVertical: 'top'
                }]}
                placeholder="contoh: fokus pada berita Indonesia..."
                placeholderTextColor={colors.textTertiary}
                value={digestNotes}
                onChangeText={setDigestNotes}
                multiline
              />

              <View style={[styles.modalButtons, { marginTop: 16, marginBottom: 8 }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => {
                    setShowDigestModal(false);
                    setDigestTopic('');
                    setDigestNotes('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleGenerateDigest}
                  disabled={digestLoading || !digestTopic.trim()}
                >
                  {digestLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Generate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Digest Detail Modal - Chat View */}
      <Modal visible={!!selectedDigest} transparent animationType="slide">
        <View style={[styles.digestDetailContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.digestDetailHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedDigest(null)} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.digestDetailTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {selectedDigest?.title || 'Digest'}
              </Text>
              <Text style={[styles.digestDetailMeta, { color: colors.textTertiary }]}>
                📅 {selectedDigest?.timeRange || 'Hari ini'} • {selectedDigest?.topic || 'News'}
              </Text>
            </View>
          </View>
          <FlatList
            data={[selectedDigest]}
            keyExtractor={() => 'digest-content'}
            contentContainerStyle={{ padding: 16 }}
            renderItem={() => (
              <View>
                <View style={[styles.digestDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.digestDetailSectionTitle, { color: colors.textPrimary }]}>📋 Ringkasan</Text>
                  <Text style={[styles.digestDetailSummary, { color: colors.textSecondary }]}>
                    {selectedDigest?.summary}
                  </Text>
                </View>
                <View style={[styles.digestDetailCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
                  <Text style={[styles.digestDetailSectionTitle, { color: colors.textPrimary }]}>📰 Konten Lengkap</Text>
                  <Markdown
                    style={{
                      body: { color: colors.textPrimary, fontSize: 15, lineHeight: 24 },
                      heading1: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
                      heading2: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
                      heading3: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
                      paragraph: { marginVertical: 8 },
                      bullet_list: { marginVertical: 8 },
                      ordered_list: { marginVertical: 8 },
                      list_item: { marginVertical: 4 },
                      strong: { fontWeight: 'bold' },
                      em: { fontStyle: 'italic' },
                      link: { color: colors.primary },
                    }}
                  >
                    {selectedDigest?.fullContent || ''}
                  </Markdown>
                </View>
              </View>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8 },
  roomList: { padding: 16 },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12
  },
  roomIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1, marginLeft: 12 },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomMeta: { fontSize: 13, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: { width: '85%', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  backButton: { marginRight: 12 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  onlineStatus: { fontSize: 13, marginTop: 2 },
  messagesList: { padding: 16 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  otherMessage: { alignSelf: 'flex-start' },
  messageSender: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  messageBubble: { padding: 12, borderRadius: 16 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  typingContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  typingText: { fontSize: 13, fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 10
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  headerBtnText: { fontSize: 14, fontWeight: '600' },
  modalSubtitle: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  tokenBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  tokenText: { fontSize: 12, fontWeight: 'bold' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarLetter: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  avatarImage: { width: 32, height: 32, borderRadius: 16 },
  aiAvatar: { borderWidth: 2, borderColor: '#fe591b' },
  aiSenderName: { fontWeight: 'bold' },
  // Mention suggestion styles
  mentionContainer: { borderTopWidth: 1, paddingVertical: 8 },
  mentionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 8, marginVertical: 2, borderRadius: 12, gap: 12 },
  mentionAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  mentionAvatarLetter: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  mentionInfo: { flex: 1 },
  mentionName: { fontSize: 15, fontWeight: '600' },
  mentionType: { fontSize: 12, marginTop: 2 },
  // Digest card styles
  digestCard: { marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 16, borderWidth: 1 },
  digestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  digestIcon: { fontSize: 24 },
  digestBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  digestBadgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  digestTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  digestSummary: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  digestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  digestTimeRange: { fontSize: 12 },
  digestTapHint: { fontSize: 12, fontWeight: '600' },
  // Digest modal styles
  digestLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  timeRangeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeRangeOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  timeRangeText: { fontSize: 13, fontWeight: '500' },
  // Digest detail styles
  digestDetailContainer: { flex: 1 },
  digestDetailHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 8 },
  digestDetailTitle: { fontSize: 18, fontWeight: 'bold' },
  digestDetailMeta: { fontSize: 13, marginTop: 2 },
  digestDetailCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  digestDetailSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  digestDetailSummary: { fontSize: 15, lineHeight: 22 },
});
