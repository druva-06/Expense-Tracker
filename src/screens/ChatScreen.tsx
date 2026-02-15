import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { aiService } from '../services/ai';
import { db } from '../services/database';
import { ChatMessage } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

export const ChatScreen = () => {
  const { userId, apiKey, refreshExpenses, lastDeletedExpense, setLastDeletedExpense } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    addSystemMessage('Hi! I\'m your expense tracking assistant. Try: "Spent 250 on coffee" or "How much did I spend this month?"');
  }, []);

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };

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

  const addAssistantMessage = (content: string, ui_hint?: any) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      ui_hint,
    };
    setMessages(prev => [...prev, message]);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const expense = await db.getExpenseById(expenseId, userId);
      if (expense) {
        await db.deleteExpense(expenseId, userId);
        setLastDeletedExpense(expense);
        addAssistantMessage('Expense deleted. You can undo this action.', 'delete_undo');
        await refreshExpenses();
      }
    } catch (error) {
      addAssistantMessage('Failed to delete expense.');
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedExpense) return;

    try {
      await db.addExpense(lastDeletedExpense);
      addAssistantMessage('Expense restored successfully.');
      setLastDeletedExpense(null);
      await refreshExpenses();
    } catch (error) {
      addAssistantMessage('Failed to restore expense.');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'user') {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessage}>
            <Text style={styles.userMessageText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.assistantMessageContainer}>
        {item.ui_hint === 'confirmation_card' && item.expense_data ? (
          <Card style={styles.confirmationCard}>
            <Card.Content>
              <Text style={styles.confirmationTitle}>Expense Added</Text>
              <Text style={styles.confirmationAmount}>
                {formatCurrency(item.expense_data.amount || 0, item.expense_data.currency)}
              </Text>
              <Text style={styles.confirmationCategory}>{item.expense_data.category}</Text>
              <Text style={styles.confirmationDate}>
                {formatDate(item.expense_data.date || '')}
              </Text>
              {item.expense_data.notes && (
                <Text style={styles.confirmationNotes}>{item.expense_data.notes}</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleDeleteExpense(item.expense_data!.id!)}>Delete</Button>
            </Card.Actions>
          </Card>
        ) : item.ui_hint === 'delete_undo' && lastDeletedExpense ? (
          <Card style={styles.undoCard}>
            <Card.Content>
              <Text>{item.content}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={handleUndoDelete}>Undo</Button>
            </Card.Actions>
          </Card>
        ) : (
          <View style={styles.assistantMessage}>
            <Text style={styles.assistantMessageText}>{item.content}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your expense..."
            multiline
            maxLength={500}
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[styles.sendButton, isProcessing && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isProcessing || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  assistantMessageText: {
    color: '#000',
    fontSize: 16,
  },
  confirmationCard: {
    maxWidth: '80%',
    backgroundColor: '#fff',
  },
  confirmationTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confirmationAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  confirmationCategory: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 4,
  },
  confirmationDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  confirmationNotes: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  undoCard: {
    maxWidth: '80%',
    backgroundColor: '#FFF3CD',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
