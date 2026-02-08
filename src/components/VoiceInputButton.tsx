import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  color: string;
  disabled?: boolean;
}

// Stub voice input button - audio recording not available in Expo Go
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  color,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    // Show alert that voice input is not available in Expo Go
    Alert.alert(
      '🎤 Voice Input',
      'Voice recording requires a native build (APK).\n\nUse the keyboard for text input.',
      [{ text: 'OK' }]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: color + '15' },
      ]}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
    >
      <Ionicons
        name="mic-outline"
        size={22}
        color={disabled ? '#9CA3AF' : color}
      />
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
});
