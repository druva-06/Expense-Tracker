import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, LayoutAnimation, View, Platform, UIManager } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { db } from '../services/database';
import { Expense } from '../types';
import { DEFAULT_OPENAI_MODEL } from '../services/ai';
import { DEFAULT_QUICK_PROMPTS, MAX_QUICK_PROMPTS } from '../contexts/AppContext';

type BackupPayload = {
  version: number;
  exportedAt: string;
  userId: string;
  expenses: Expense[];
};

export const SettingsScreen = () => {
  const {
    apiKey,
    aiModel,
    quickPrompts,
    setApiKey,
    clearApiKey,
    setAiModel,
    resetAiModel,
    saveQuickPrompts,
    resetQuickPrompts,
    userId,
    refreshExpenses,
  } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [aiModelInput, setAiModelInput] = useState(aiModel);
  const [promptInput, setPromptInput] = useState('');
  const [editableQuickPrompts, setEditableQuickPrompts] = useState<string[]>(quickPrompts);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [isSavingPrompts, setIsSavingPrompts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setApiKeyInput(apiKey || '');
  }, [apiKey]);

  useEffect(() => {
    setAiModelInput(aiModel);
  }, [aiModel]);

  useEffect(() => {
    setEditableQuickPrompts(quickPrompts);
  }, [quickPrompts]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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

  const handleSaveAiModel = async () => {
    if (!aiModelInput.trim()) {
      Alert.alert('Error', 'Please enter a valid model name');
      return;
    }

    setIsSavingModel(true);
    try {
      await setAiModel(aiModelInput.trim());
      Alert.alert('Success', 'AI model saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save AI model');
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleResetAiModel = () => {
    if (isSavingModel) {
      return;
    }

    Alert.alert('Reset AI model', `Switch back to default model (${DEFAULT_OPENAI_MODEL})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          setIsSavingModel(true);
          try {
            await resetAiModel();
            setAiModelInput(DEFAULT_OPENAI_MODEL);
            Alert.alert('Done', `AI model reset to ${DEFAULT_OPENAI_MODEL}.`);
          } catch (error) {
            Alert.alert('Error', 'Failed to reset AI model.');
          } finally {
            setIsSavingModel(false);
          }
        },
      },
    ]);
  };

  const handleAddQuickPrompt = () => {
    const nextPrompt = promptInput.trim();
    if (!nextPrompt) {
      Alert.alert('Error', 'Please enter a prompt to add.');
      return;
    }

    if (editableQuickPrompts.includes(nextPrompt)) {
      Alert.alert('Duplicate prompt', 'This quick prompt already exists.');
      return;
    }

    if (editableQuickPrompts.length >= MAX_QUICK_PROMPTS) {
      Alert.alert('Prompt limit reached', `You can add up to ${MAX_QUICK_PROMPTS} quick prompts.`);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setEditableQuickPrompts(prev => [...prev, nextPrompt]);
    setPromptInput('');
  };

  const handleRemoveQuickPrompt = (promptToRemove: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setEditableQuickPrompts(prev => prev.filter(prompt => prompt !== promptToRemove));
  };

  const handleSaveQuickPrompts = async () => {
    setIsSavingPrompts(true);
    try {
      await saveQuickPrompts(editableQuickPrompts);
      Alert.alert('Success', 'Quick prompts saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save quick prompts.');
    } finally {
      setIsSavingPrompts(false);
    }
  };

  const handleResetQuickPrompts = () => {
    if (isSavingPrompts) {
      return;
    }

    Alert.alert('Reset quick prompts', 'Restore the default quick prompts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          setIsSavingPrompts(true);
          try {
            await resetQuickPrompts();
            setEditableQuickPrompts(DEFAULT_QUICK_PROMPTS);
            setPromptInput('');
            Alert.alert('Done', 'Quick prompts were reset to defaults.');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset quick prompts.');
          } finally {
            setIsSavingPrompts(false);
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

        <SettingsSectionCard title="OpenAI Model" icon="tune-variant">
            <Text style={styles.description}>
              Choose the model used for chat parsing (for example: gpt-4o-mini, gpt-5-nano).
            </Text>
            <TextInput
              mode="outlined"
              label="Model"
              value={aiModelInput}
              onChangeText={setAiModelInput}
              style={styles.input}
              placeholder={DEFAULT_OPENAI_MODEL}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              mode="contained"
              onPress={handleSaveAiModel}
              loading={isSavingModel}
              disabled={isSavingModel}
              style={styles.button}
            >
              Update Model
            </Button>
            <Button
              mode="text"
              onPress={handleResetAiModel}
              disabled={isSavingModel || aiModel === DEFAULT_OPENAI_MODEL}
            >
              Reset to Default ({DEFAULT_OPENAI_MODEL})
            </Button>
        </SettingsSectionCard>

        <SettingsSectionCard title="Quick Prompts" icon="flash-outline">
            <Text style={styles.description}>
              Build your own quick prompts for chat. You can keep up to {MAX_QUICK_PROMPTS} prompts for a clean and fast workflow.
            </Text>
            <Text style={styles.counterText}>
              {editableQuickPrompts.length}/{MAX_QUICK_PROMPTS} prompts used
            </Text>
            <View style={styles.promptInputRow}>
              <TextInput
                mode="outlined"
                label="New quick prompt"
                value={promptInput}
                onChangeText={setPromptInput}
                style={styles.promptInput}
                placeholder="e.g. Spent 899 on groceries"
                autoCapitalize="sentences"
                autoCorrect
              />
              <Button
                mode="contained"
                onPress={handleAddQuickPrompt}
                disabled={editableQuickPrompts.length >= MAX_QUICK_PROMPTS || isSavingPrompts}
                style={styles.addPromptButton}
              >
                Add
              </Button>
            </View>
            <View style={styles.promptList}>
              {editableQuickPrompts.length === 0 ? (
                <Text style={styles.hint}>No prompts yet. Add one above to get started.</Text>
              ) : (
                editableQuickPrompts.map(prompt => (
                  <View key={prompt} style={styles.promptCard}>
                    <Text style={styles.promptText}>{prompt}</Text>
                    <IconButton
                      icon="close-circle-outline"
                      size={20}
                      onPress={() => handleRemoveQuickPrompt(prompt)}
                      disabled={isSavingPrompts}
                    />
                  </View>
                ))
              )}
            </View>
            <Button
              mode="contained"
              onPress={handleSaveQuickPrompts}
              loading={isSavingPrompts}
              disabled={isSavingPrompts}
              style={styles.button}
            >
              Save Quick Prompts
            </Button>
            <Button
              mode="text"
              onPress={handleResetQuickPrompts}
              disabled={isSavingPrompts}
            >
              Reset to Default Prompts
            </Button>
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
  promptInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  promptInput: {
    flex: 1,
    marginRight: 8,
  },
  addPromptButton: {
    marginBottom: 16,
  },
  promptList: {
    marginBottom: 8,
  },
  promptCard: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    marginBottom: 8,
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  promptText: {
    color: '#312E81',
    flex: 1,
    paddingVertical: 10,
  },
  counterText: {
    color: '#6D28D9',
    fontWeight: '700',
    marginBottom: 10,
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
