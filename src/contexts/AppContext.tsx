import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/database';
import { aiService, DEFAULT_OPENAI_MODEL } from '../services/ai';
import { storage } from '../utils/storage';
import { generateUserId } from '../utils/helpers';
import { Expense } from '../types';

export const MAX_QUICK_PROMPTS = 3;
export const DEFAULT_QUICK_PROMPTS = [
  'Spent 250 on coffee',
  'Show expenses for this month',
  'Show expenses for March 2026',
];

const normalizeQuickPrompts = (prompts: string[] | null | undefined): string[] => {
  if (prompts == null) {
    return DEFAULT_QUICK_PROMPTS;
  }

  const cleaned = prompts
    .map(prompt => prompt.trim())
    .filter(prompt => prompt.length > 0);
  const unique = Array.from(new Set(cleaned));
  return unique.slice(0, MAX_QUICK_PROMPTS);
};

interface AppContextType {
  userId: string;
  isLoading: boolean;
  apiKey: string | null;
  aiModel: string;
  quickPrompts: string[];
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  setAiModel: (model: string) => Promise<void>;
  resetAiModel: () => Promise<void>;
  saveQuickPrompts: (prompts: string[]) => Promise<void>;
  resetQuickPrompts: () => Promise<void>;
  expenses: Expense[];
  refreshExpenses: () => Promise<void>;
  lastDeletedExpense: Expense | null;
  setLastDeletedExpense: (expense: Expense | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>('');
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [aiModel, setAiModelState] = useState<string>(DEFAULT_OPENAI_MODEL);
  const [quickPrompts, setQuickPromptsState] = useState<string[]>(DEFAULT_QUICK_PROMPTS);
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastDeletedExpense, setLastDeletedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      await db.init();

      let storedUserId = await storage.getUserId();
      if (!storedUserId) {
        storedUserId = generateUserId();
        await storage.setUserId(storedUserId);
      }
      setUserId(storedUserId);

      const storedApiKey = await storage.getApiKey();
      if (storedApiKey) {
        setApiKeyState(storedApiKey);
        aiService.setApiKey(storedApiKey);
      }

      const storedAiModel = await storage.getAiModel();
      const modelToUse = storedAiModel?.trim() || DEFAULT_OPENAI_MODEL;
      setAiModelState(modelToUse);
      aiService.setModel(modelToUse);

      try {
        const storedQuickPrompts = await storage.getQuickPrompts();
        setQuickPromptsState(normalizeQuickPrompts(storedQuickPrompts));
      } catch (error) {
        console.error('Failed to read quick prompts from storage:', error);
        setQuickPromptsState(DEFAULT_QUICK_PROMPTS);
      }

      // Load expenses with the userId we just set
      if (storedUserId) {
        const recentExpenses = await db.getRecentExpenses(storedUserId, 50);
        setExpenses(recentExpenses);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setApiKey = async (key: string) => {
    await storage.setApiKey(key);
    setApiKeyState(key);
    aiService.setApiKey(key);
  };

  const clearApiKey = async () => {
    await storage.clearApiKey();
    setApiKeyState(null);
    aiService.setApiKey('');
  };

  const setAiModel = async (model: string) => {
    const trimmedModel = model.trim() || DEFAULT_OPENAI_MODEL;
    await storage.setAiModel(trimmedModel);
    setAiModelState(trimmedModel);
    aiService.setModel(trimmedModel);
  };

  const resetAiModel = async () => {
    await storage.clearAiModel();
    setAiModelState(DEFAULT_OPENAI_MODEL);
    aiService.setModel(DEFAULT_OPENAI_MODEL);
  };

  const saveQuickPrompts = async (prompts: string[]) => {
    const normalizedPrompts = normalizeQuickPrompts(prompts);
    await storage.setQuickPrompts(normalizedPrompts);
    setQuickPromptsState(normalizedPrompts);
  };

  const resetQuickPrompts = async () => {
    await storage.clearQuickPrompts();
    setQuickPromptsState(DEFAULT_QUICK_PROMPTS);
  };

  const refreshExpenses = async () => {
    if (!userId) return;
    try {
      const recentExpenses = await db.getRecentExpenses(userId, 50);
      setExpenses(recentExpenses);
    } catch (error) {
      console.error('Error refreshing expenses:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        userId,
        isLoading,
        apiKey,
        aiModel,
        quickPrompts,
        setApiKey,
        clearApiKey,
        setAiModel,
        resetAiModel,
        saveQuickPrompts,
        resetQuickPrompts,
        expenses,
        refreshExpenses,
        lastDeletedExpense,
        setLastDeletedExpense,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
