import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/database';
import { aiService } from '../services/ai';
import { storage } from '../utils/storage';
import { generateUserId } from '../utils/helpers';
import { Expense } from '../types';

interface AppContextType {
  userId: string;
  isLoading: boolean;
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  expenses: Expense[];
  refreshExpenses: () => Promise<void>;
  lastDeletedExpense: Expense | null;
  setLastDeletedExpense: (expense: Expense | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>('');
  const [apiKey, setApiKeyState] = useState<string | null>(null);
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

      await refreshExpenses();
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
        setApiKey,
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
