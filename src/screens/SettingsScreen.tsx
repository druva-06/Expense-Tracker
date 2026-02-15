import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';

export const SettingsScreen = () => {
  const { apiKey, setApiKey } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsSaving(true);
    try {
      await setApiKey(apiKeyInput.trim());
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="OpenAI API Key" />
          <Card.Content>
            <Text style={styles.description}>
              Enter your OpenAI API key to enable intelligent expense parsing. Without it, the app will
              use basic pattern matching.
            </Text>
            <TextInput
              mode="outlined"
              label="API Key"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              secureTextEntry
              style={styles.input}
              placeholder="sk-..."
            />
            <Button
              mode="contained"
              onPress={handleSaveApiKey}
              loading={isSaving}
              disabled={isSaving}
              style={styles.button}
            >
              Save API Key
            </Button>
            <Text style={styles.hint}>
              Get your API key from: https://platform.openai.com/api-keys
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="About" />
          <Card.Content>
            <Text style={styles.infoText}>Expense Tracker</Text>
            <Text style={styles.infoText}>Version 1.0.0</Text>
            <Text style={styles.description}>
              An offline-first expense tracking app with AI-powered chat interface.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Features" />
          <Card.Content>
            <Text style={styles.feature}>• Chat-based expense entry</Text>
            <Text style={styles.feature}>• Offline-first with local storage</Text>
            <Text style={styles.feature}>• Intelligent category mapping</Text>
            <Text style={styles.feature}>• Monthly insights and analytics</Text>
            <Text style={styles.feature}>• Edit and delete with undo</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
});
