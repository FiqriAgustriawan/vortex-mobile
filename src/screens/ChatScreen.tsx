import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { BackIcon, SendIcon, ImageGenIcon, SparkleIcon } from '../components/Icons';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, getModelById, getSystemPrompt } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { CustomPromptModal, useCustomPrompt } from '../components/CustomPromptModal';
import { ThinkingDotsAnimated } from '../components/ThinkingIndicator';
import * as FileSystem from 'expo-file-system';

interface ChatScreenProps {
  modelName?: string;
  conversationId?: string;
  onGoBack: () => void;
  guestToken?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
  isStreaming?: boolean;
}

// Function to clean markdown symbols
const cleanMarkdownSymbols = (text: string): string => {
  return text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\_\_\_/g, '')
    .replace(/\_\_/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const ChatScreen: React.FC<ChatScreenProps> = ({
  modelName = 'Vortex Flash',
  conversationId: initialConversationId,
  onGoBack,
  guestToken
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const getModelIdFromName = (name: string): string => {
    if (name.includes('Pro')) return 'vortex-pro';
    if (name.includes('Code')) return 'vortex-code';
    return 'vortex-flash';
  };

  const modelId = getModelIdFromName(modelName);
  const model = getModelById(modelId);
  const defaultSystemPrompt = getSystemPrompt(modelId);
  const [customPrompt, setCustomPrompt] = useCustomPrompt(modelId, defaultSystemPrompt);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Halo! Saya ${model.name}.\n\n${model.description}\n\nApa yang ingin Anda kerjakan hari ini?`,
      sender: 'bot',
      timestamp: new Date()
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    checkConnection();
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, { method: 'GET' });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
    setConnectionChecked(true);
  };

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages.map((m: any) => ({
          id: m._id,
          text: m.content,
          sender: m.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(m.createdAt),
        }));
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.log('Failed to load conversation:', error);
    }
  };

  const createConversation = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestToken ? { 'Authorization': `Bearer ${guestToken}` } : {})
        },
        body: JSON.stringify({
          title: 'Percakapan Baru',
          modelId: model.id,
          modelName: model.name,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.conversation._id;
      }
    } catch (error) {
      console.log('Failed to create conversation:', error);
    }
    return null;
  };

  const saveMessage = async (convId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      });
    } catch (error) {
      console.log('Failed to save message:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        setSelectedImageBase64(result.assets[0].base64);
      } else if (result.assets[0].uri) {
        // Read base64 from file
        try {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setSelectedImageBase64(base64);
        } catch {
          console.log('Failed to read image as base64');
        }
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputText(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleSendMessage = async () => {
    if ((inputText.trim() === '' && !selectedImage) || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText || '📷 [Gambar]',
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined,
    };
    setMessages(prev => [...prev, userMsg]);

    const currentInput = inputText;
    const currentImage = selectedImage;
    const currentImageBase64 = selectedImageBase64;

    setInputText('');
    setSelectedImage(null);
    setSelectedImageBase64(null);
    setLoading(true);

    // Create conversation if not exists
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      setConversationId(convId);
    }

    // Save user message
    if (convId) {
      await saveMessage(convId, 'user', currentInput || '[Gambar]');
    }

    // Prepare history
    const history = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Show thinking animation
    setIsThinking(true);

    // Add bot message placeholder for streaming
    const botMsgId = (Date.now() + 1).toString();

    try {
      // Use streaming endpoint
      const streamUrl = `${API_CONFIG.BASE_URL}/api/chat/stream`;
      const requestBody: any = {
        message: currentInput || 'Analisis gambar ini.',
        model: model.apiModel,
        systemPrompt: customPrompt,
        history,
      };

      // Add image if present
      if (currentImageBase64) {
        requestBody.image = {
          base64: currentImageBase64,
          mimeType: 'image/jpeg',
        };
      }

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('API failed');
      }

      // Hide thinking, show response
      setIsThinking(false);

      // Add bot message now
      setMessages(prev => [...prev, {
        id: botMsgId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: true,
      }]);

      // Handle streaming response
      const text = await response.text();
      const lines = text.split('\n');
      let fullText = '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            // Check for backend error
            if (data.error) {
              console.error('Backend stream error:', data.error);
              fullText = `⚠️ Error dari AI: ${data.error}`;
              // Force update message to show error
              setMessages(prev => prev.map(m =>
                m.id === botMsgId
                  ? { ...m, text: fullText, isStreaming: false }
                  : m
              ));
              break; // Stop processing
            }

            if (data.text) {
              fullText += data.text;
              setMessages(prev => prev.map(m =>
                m.id === botMsgId
                  ? { ...m, text: cleanMarkdownSymbols(fullText) }
                  : m
              ));
            }
          } catch { }
        }
      }

      // Mark as not streaming
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, isStreaming: false, text: cleanMarkdownSymbols(fullText) || 'Maaf, gagal memproses respons.' }
          : m
      ));

      // Save bot response
      if (convId && fullText) {
        await saveMessage(convId, 'assistant', cleanMarkdownSymbols(fullText));
      }

      setIsOnline(true);
    } catch (error) {
      console.error('Send error:', error);
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: botMsgId,
        text: 'Maaf, tidak bisa terhubung ke server. Periksa koneksi.',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: false,
      }]);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const canSend = (inputText.trim() !== '' || selectedImage) && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <BackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={() => setShowPromptModal(true)}>
          <View style={styles.headerTitleRow}>
            <VortexLogoSimple size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{model.name}</Text>
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4ADE80' : '#FBBF24' }]} />
            <Text style={styles.statusText}>
              {!connectionChecked ? 'Connecting...' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' ? styles.userRow : styles.botRow]}>
            {msg.sender === 'bot' && (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <VortexLogoSimple size={18} color="#FFFFFF" />
              </View>
            )}
            <View style={[
              styles.bubble,
              msg.sender === 'user'
                ? [styles.userBubble, { backgroundColor: colors.userBubble }]
                : [styles.botBubble, { backgroundColor: colors.aiBubble, borderColor: colors.border }]
            ]}>
              {msg.image && (
                <Image source={{ uri: msg.image }} style={styles.msgImage} />
              )}
              <Text style={[
                styles.msgText,
                { color: msg.sender === 'user' ? colors.userBubbleText : colors.aiBubbleText }
              ]}>
                {msg.text}
                {msg.isStreaming && <Text style={styles.cursor}>▋</Text>}
              </Text>
              <Text style={[
                styles.msgTime,
                { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textTertiary }
              ]}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {/* Thinking Animation */}
        {isThinking && (
          <View style={[styles.msgRow, styles.botRow]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <VortexLogoSimple size={18} color="#FFFFFF" />
            </View>
            <ThinkingDotsAnimated visible={true} />
          </View>
        )}
      </ScrollView>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={[styles.imagePreview, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImage}
            onPress={() => { setSelectedImage(null); setSelectedImageBase64(null); }}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
          <Text style={[styles.imageHint, { color: colors.textSecondary }]}>
            Gambar akan dianalisis oleh AI
          </Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage} disabled={loading}>
          <Ionicons name="image-outline" size={24} color={loading ? colors.textTertiary : colors.primary} />
        </TouchableOpacity>

        <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Ketik atau bicara..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            editable={!loading}
            multiline
            maxLength={4000}
          />
        </View>

        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          color={colors.primary}
          disabled={loading}
        />

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: canSend ? colors.primary : colors.surfaceSecondary }]}
          onPress={handleSendMessage}
          disabled={!canSend}
        >
          <SendIcon size={20} color={canSend ? '#FFFFFF' : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Custom Prompt Modal */}
      <CustomPromptModal
        visible={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        modelId={modelId}
        modelName={model.name}
        currentPrompt={defaultSystemPrompt}
        onSave={setCustomPrompt}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 14 },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  headerRight: { width: 40 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  msgRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 4 },
  botBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  msgImage: { width: 180, height: 140, borderRadius: 10, marginBottom: 6 },
  msgText: { fontSize: 15, lineHeight: 21 },
  cursor: { color: '#fe591b' },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  imagePreview: { padding: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  previewImage: { width: 50, height: 50, borderRadius: 8 },
  removeImage: { marginLeft: 8 },
  imageHint: { flex: 1, marginLeft: 8, fontSize: 12 },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'flex-end' },
  attachButton: { padding: 8 },
  inputWrapper: { flex: 1, borderRadius: 22, borderWidth: 1, marginHorizontal: 4 },
  input: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
