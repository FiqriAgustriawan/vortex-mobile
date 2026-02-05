import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  color: string;
  disabled?: boolean;
}

// Simple voice input simulation (for demo - real implementation needs expo-speech)
// This simulates voice recording and shows feedback to user
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  color,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch {
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      setHasPermission(true);
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // In production, you'd send this audio file to a speech-to-text service
        // For demo, we'll show a placeholder message
        onTranscript('[Voice input recorded - Speech-to-text integration needed]');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isRecording ? '#EF4444' : color + '15' },
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {isRecording ? (
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, styles.pulse]} />
          <Ionicons name="mic" size={22} color="#FFFFFF" />
        </View>
      ) : (
        <Ionicons
          name="mic-outline"
          size={22}
          color={disabled ? '#9CA3AF' : color}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  pulse: {
    opacity: 0.7,
  },
});
