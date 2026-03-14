import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { db } from '../services/database';
import { Expense } from '../types';

type BackupPayload = {
  version: number;
  exportedAt: string;
  userId: string;
  expenses: Expense[];
};

export const SettingsScreen = () => {
  const { apiKey, setApiKey, clearApiKey, userId, refreshExpenses } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleResetApiKey = () => {
    if (isSaving) {
      return;
    }

    Alert.alert('Delete API key', 'This removes the saved API key from this device. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsSaving(true);
          try {
            await clearApiKey();
            setApiKeyInput('');
            Alert.alert('Done', 'API key deleted. The app will use offline parsing until you add a new key.');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete API key.');
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  const isValidDate = (value: unknown): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const isValidExpenseShape = (candidate: any): candidate is Expense =>
    candidate &&
    typeof candidate.id === 'string' &&
    typeof candidate.amount === 'number' &&
    typeof candidate.currency === 'string' &&
    typeof candidate.category === 'string' &&
    isValidDate(candidate.date) &&
    typeof candidate.created_at === 'number' &&
    typeof candidate.updated_at === 'number';

  const normalizeImportedExpenses = (rawExpenses: any[]): Expense[] =>
    rawExpenses
      .filter(isValidExpenseShape)
      .map(expense => ({
        ...expense,
        user_id: userId,
      }));

  const handleExportData = async () => {
    if (!userId) {
      Alert.alert('Error', 'User profile is not ready yet. Please try again.');
      return;
    }

    setIsExporting(true);
    try {
      const expenses = await db.getExpenses(userId);
      const payload: BackupPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId,
        expenses,
      };

      const backupUri = `${FileSystem.cacheDirectory}expense-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(backupUri, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupUri, {
          mimeType: 'application/json',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Backup created', `Saved backup at:\n${backupUri}`);
      }
    } catch (error) {
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const runImportReplace = async () => {
    if (!userId) {
      Alert.alert('Error', 'User profile is not ready yet. Please try again.');
      return;
    }

    setIsImporting(true);
    try {
      const pickedFile = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (pickedFile.canceled) {
        return;
      }

      const fileUri = pickedFile.assets?.[0]?.uri;
      if (!fileUri) {
        Alert.alert('Import failed', 'Unable to read selected file.');
        return;
      }

      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content) as Partial<BackupPayload>;

      if (!Array.isArray(parsed.expenses)) {
        Alert.alert('Invalid backup', 'Selected file does not contain expenses.');
        return;
      }

      const normalizedExpenses = normalizeImportedExpenses(parsed.expenses);
      await db.replaceExpensesForUser(userId, normalizedExpenses);
      await refreshExpenses();
      Alert.alert('Import complete', `Imported ${normalizedExpenses.length} expenses successfully.`);
    } catch (error) {
      Alert.alert('Import failed', 'Could not import data from the selected file.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportData = () => {
    if (isImporting || isExporting) {
      return;
    }

    Alert.alert(
      'Import backup',
      'Import will replace all current local expenses with the selected backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import & Replace',
          style: 'destructive',
          onPress: () => {
            void runImportReplace();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Customize your assistant and app behavior.</Text>

        <SettingsSectionCard title="OpenAI API Key" icon="key-outline">
            <Text style={styles.description}>
              Enter your OpenAI API key to enable chat-based expense actions. Without a valid key,
              chat add/query/edit/delete will be blocked.
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
              Update API Key
            </Button>
            <Button
              mode="text"
              onPress={handleResetApiKey}
              disabled={isSaving || !apiKey}
              textColor="#DC2626"
            >
              Delete Saved API Key
            </Button>
            <Text style={styles.hint}>
              Get your API key from: https://platform.openai.com/api-keys
            </Text>
        </SettingsSectionCard>

        <SettingsSectionCard title="Backup & Restore" icon="database-export-outline">
            <Text style={styles.description}>
              Export your current local data as a backup file, or import a backup to restore expenses.
            </Text>
            <Button
              mode="contained"
              icon="download"
              onPress={handleExportData}
              loading={isExporting}
              disabled={isExporting || isImporting}
              style={styles.button}
            >
              Export Data
            </Button>
            <Button
              mode="outlined"
              icon="upload"
              onPress={handleImportData}
              loading={isImporting}
              disabled={isExporting || isImporting}
              style={styles.button}
            >
              Import Data
            </Button>
            <Text style={styles.hint}>
              Import replaces existing local expenses to keep your data clean.
            </Text>
        </SettingsSectionCard>

        <SettingsSectionCard title="Features" icon="star-outline">
            <Text style={styles.feature}>• Chat-based expense entry</Text>
            <Text style={styles.feature}>• Offline-first with local storage</Text>
            <Text style={styles.feature}>• Intelligent category mapping</Text>
            <Text style={styles.feature}>• Monthly insights and analytics</Text>
            <Text style={styles.feature}>• Edit and delete with undo</Text>
        </SettingsSectionCard>

        <SettingsSectionCard title="About" icon="information-outline">
            <Text style={styles.infoText}>Expense Tracker</Text>
            <Text style={styles.infoText}>Version 1.0.0</Text>
            <Text style={styles.description}>
              An offline-first expense tracking app with AI-powered chat interface.
            </Text>
        </SettingsSectionCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: '#64748B',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
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
    color: '#6B7280',
    marginTop: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#111827',
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
});
