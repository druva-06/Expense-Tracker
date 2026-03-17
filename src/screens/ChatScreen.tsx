import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  View,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { aiService } from '../services/ai';
import { db } from '../services/database';
import { ChatMessage, Expense } from '../types';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ExpenseConfirmationCard } from '../components/chat/ExpenseConfirmationCard';
import { UndoDeleteCard } from '../components/chat/UndoDeleteCard';
import { QuickPromptRow } from '../components/chat/QuickPromptRow';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ExpenseEditModal } from '../components/shared/ExpenseEditModal';

type SpeechPermissionResponse = { granted: boolean };
type SpeechRecognitionModuleLike = {
  start: (options: {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    addsPunctuation: boolean;
  }) => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<SpeechPermissionResponse>;
};

type SpeechRecognitionEventHook = (eventName: string, listener: (event: any) => void) => void;

let speechModule: SpeechRecognitionModuleLike | null = null;
let useSpeechRecognitionEventHook: SpeechRecognitionEventHook = () => undefined;

try {
  const speech = require('expo-speech-recognition') as {
    ExpoSpeechRecognitionModule: SpeechRecognitionModuleLike;
    useSpeechRecognitionEvent: SpeechRecognitionEventHook;
  };
  speechModule = speech.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEventHook = speech.useSpeechRecognitionEvent;
} catch {
  // Expo Go does not include this native module; we disable voice mode gracefully.
}

export const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { userId, quickPrompts, refreshExpenses, lastDeletedExpense, setLastDeletedExpense } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [stableTabBarHeight, setStableTabBarHeight] = useState(tabBarHeight);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isVoiceAvailable = Boolean(speechModule);

  const addAssistantMessage = (content: string, ui_hint?: any) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      ui_hint,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, message]);
  };

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    addSystemMessage('Hi! I\'m your expense tracking assistant. Try: "Spent 250 on coffee" or "How much did I spend this month?"');
  }, []);

  useEffect(() => {
    const showHandler = (event: any) => {
      setKeyboardHeight(event?.endCoordinates?.height ?? 0);
    };
    const hideHandler = () => {
      setKeyboardHeight(0);
    };

    const showWillSub = Keyboard.addListener('keyboardWillShow', showHandler);
    const showDidSub = Keyboard.addListener('keyboardDidShow', showHandler);
    const hideWillSub = Keyboard.addListener('keyboardWillHide', hideHandler);
    const hideDidSub = Keyboard.addListener('keyboardDidHide', hideHandler);
    const blurUnsubscribe = navigation.addListener('blur', hideHandler);

    return () => {
      showWillSub.remove();
      showDidSub.remove();
      hideWillSub.remove();
      hideDidSub.remove();
      blurUnsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    if (keyboardHeight === 0 && tabBarHeight > 0) {
      setStableTabBarHeight(tabBarHeight);
    }
  }, [keyboardHeight, tabBarHeight]);

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);
  };

  useSpeechRecognitionEventHook('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEventHook('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEventHook('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript?.trim();
    if (transcript) {
      setInputText(transcript);
    }
  });

  useSpeechRecognitionEventHook('error', (event: any) => {
    setIsListening(false);
    addAssistantMessage(`Voice input error: ${event?.message ?? 'Unknown error'}`);
  });

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;
    if (isListening && speechModule) {
      speechModule.stop();
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, userMessage]);
    const input = inputText;
    setInputText('');
    setIsProcessing(true);

    try {
      const aiResponse = await aiService.parseExpenseInput(input, userId);

      switch (aiResponse.intent) {
        case 'add_expense':
          await handleAddExpense(aiResponse);
          break;

        case 'query_expenses':
          await handleQueryExpenses(aiResponse);
          break;

        case 'edit_expense':
          addAssistantMessage(aiResponse.response_text, aiResponse.ui_hint);
          break;

        case 'delete_expense':
          addAssistantMessage(aiResponse.response_text, aiResponse.ui_hint);
          break;

        case 'help':
        default:
          addAssistantMessage(aiResponse.response_text, aiResponse.ui_hint);
          break;
      }
    } catch (error) {
      addAssistantMessage('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const handleVoiceToggle = async () => {
    if (isProcessing) return;

    if (isListening) {
      speechModule?.stop();
      return;
    }

    if (!speechModule) {
      addAssistantMessage('Voice input needs a development build (not Expo Go).');
      return;
    }

    const permission = await speechModule.requestPermissionsAsync();
    if (!permission.granted) {
      addAssistantMessage('Microphone permission is required for voice input.');
      return;
    }

    try {
      speechModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (error) {
      addAssistantMessage('Unable to start voice input right now.');
    }
  };

  const handleAddExpense = async (aiResponse: any) => {
    try {
      if (!aiResponse.data?.amount) {
        addAssistantMessage('How much did you spend?', 'clarification');
        return;
      }

      const expense = await db.addExpense({
        user_id: userId,
        amount: aiResponse.data.amount,
        currency: aiResponse.data.currency || 'INR',
        category: aiResponse.data.category,
        payment_method: aiResponse.data.payment_method,
        date: aiResponse.data.date,
        notes: aiResponse.data.notes,
      });

      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse.response_text,
        timestamp: Date.now(),
        ui_hint: 'confirmation_card',
        expense_data: expense,
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, message]);
      await refreshExpenses();
    } catch (error) {
      addAssistantMessage('Failed to add expense. Please try again.');
    }
  };

  const handleQueryExpenses = async (aiResponse: any) => {
    try {
      const expenses = await db.getExpenses(userId, aiResponse.query);
      const insight = await aiService.generateInsight(expenses);

      addAssistantMessage(insight, 'summary_card');
    } catch (error) {
      addAssistantMessage('Failed to fetch expenses. Please try again.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const expense = await db.getExpenseById(expenseId, userId);
      if (expense) {
        await db.deleteExpense(expenseId, userId);
        setLastDeletedExpense(expense);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        addAssistantMessage('Expense deleted. You can undo this action.', 'delete_undo');
        await refreshExpenses();
      }
    } catch (error) {
      addAssistantMessage('Failed to delete expense.');
    }
  };

  const handleEditExpense = (expense: Partial<Expense>) => {
    if (
      !expense.id ||
      !expense.user_id ||
      expense.amount === undefined ||
      !expense.currency ||
      !expense.category ||
      !expense.date
    ) {
      addAssistantMessage('Unable to edit this expense. Please open it from Home and try again.');
      return;
    }

    setEditingExpense(expense as Expense);
  };

  const handleSaveExpenseEdit = async (updates: {
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }) => {
    if (!editingExpense) return;

    const updated = await db.updateExpense(editingExpense.id, userId, updates);
    if (!updated) {
      addAssistantMessage('Failed to update expense.');
      return;
    }

    setMessages(prev =>
      prev.map(message => {
        if (message.expense_data?.id !== editingExpense.id) {
          return message;
        }

        return {
          ...message,
          expense_data: {
            ...message.expense_data,
            ...updates,
          },
        };
      })
    );
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addAssistantMessage('Expense updated successfully.');
    await refreshExpenses();
    setEditingExpense(null);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedExpense) return;

    try {
      await db.addExpense(lastDeletedExpense);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      addAssistantMessage('Expense restored successfully.');
      setLastDeletedExpense(null);
      await refreshExpenses();
    } catch (error) {
      addAssistantMessage('Failed to restore expense.');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'user') {
      return <ChatBubble role="user" content={item.content} timestamp={item.timestamp} />;
    }

    if (item.ui_hint === 'confirmation_card' && item.expense_data) {
      return (
        <ExpenseConfirmationCard
          expense={item.expense_data}
          onEdit={() => handleEditExpense(item.expense_data!)}
          onDelete={() => handleDeleteExpense(item.expense_data!.id!)}
        />
      );
    }

    if (item.ui_hint === 'delete_undo' && lastDeletedExpense) {
      return <UndoDeleteCard message={item.content} onUndo={handleUndoDelete} />;
    }

    return <ChatBubble role="assistant" content={item.content} timestamp={item.timestamp} />;
  };

  const dockedBottomOffset = Math.max(8, Math.round((stableTabBarHeight - insets.bottom) * 0.35));
  const keyboardBottomOffset = 2;
  const isKeyboardOpen = keyboardHeight > 0;
  const composerBottomOffset = isKeyboardOpen ? keyboardBottomOffset : dockedBottomOffset;
  const reservedComposerHeight = 88;
  const typingFooter = isProcessing ? (
    <View style={styles.typingFooter}>
      <ChatBubble role="assistant" content="" isTyping />
    </View>
  ) : (
    <View style={styles.listTailSpacer} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        enabled
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Smart Assistant</Text>
            </View>
            <IconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
          </View>
          <Text style={styles.headerTitle}>Your Expense Copilot</Text>
          <Text style={styles.headerSubtitle}>Track, query, edit, and manage expenses in one beautiful flow.</Text>
        </View>
        <QuickPromptRow
          prompts={quickPrompts}
          onSelectPrompt={handleSelectQuickPrompt}
          onCustomize={() => navigation.navigate('Settings')}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          ListFooterComponent={typingFooter}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: dockedBottomOffset + reservedComposerHeight },
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          keyboardShouldPersistTaps="handled"
        />

        <ChatComposer
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onVoiceToggle={handleVoiceToggle}
          voiceAvailable={isVoiceAvailable}
          disabled={isProcessing}
          isListening={isListening}
          bottomOffset={composerBottomOffset}
        />
        <ExpenseEditModal
          visible={Boolean(editingExpense)}
          expense={editingExpense}
          onDismiss={() => setEditingExpense(null)}
          onSave={handleSaveExpenseEdit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  bgOrbOne: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DDD6FE',
    opacity: 0.75,
  },
  bgOrbTwo: {
    position: 'absolute',
    top: 140,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#BFDBFE',
    opacity: 0.35,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#6D28D9',
    fontWeight: '700',
    fontSize: 11,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#5B5F77',
    fontSize: 14,
    lineHeight: 20,
  },
  messageList: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  typingFooter: {
    paddingTop: 4,
  },
  listTailSpacer: {
    height: 4,
  },
});
