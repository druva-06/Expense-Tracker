import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceToggle: () => void;
  voiceAvailable?: boolean;
  disabled: boolean;
  isListening: boolean;
  bottomOffset?: number;
}

export const ChatComposer = ({
  value,
  onChangeText,
  onSend,
  onVoiceToggle,
  voiceAvailable = true,
  disabled,
  isListening,
  bottomOffset = 0,
}: ChatComposerProps) => {
  return (
    <View style={[styles.inputContainer, { marginBottom: bottomOffset }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Type an expense..."
        placeholderTextColor="#94A3B8"
        multiline
        maxLength={500}
        editable={!disabled}
        returnKeyType="send"
        blurOnSubmit={false}
      />
      {voiceAvailable ? (
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={onVoiceToggle}
          disabled={disabled}
        >
          <MaterialCommunityIcons name={isListening ? 'microphone' : 'microphone-outline'} size={18} color="#6D28D9" />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[styles.sendButton, (disabled || !value.trim()) && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={disabled || !value.trim()}
      >
        <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginRight: 8,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6D28D9',
    borderRadius: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  voiceButton: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  sendButtonDisabled: {
    backgroundColor: '#A8A3C2',
  },
});
