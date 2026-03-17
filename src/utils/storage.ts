import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: '@expense_tracker:api_key',
  AI_MODEL: '@expense_tracker:ai_model',
  QUICK_PROMPTS: '@expense_tracker:quick_prompts',
  USER_ID: '@expense_tracker:user_id',
  ONBOARDING_DONE: '@expense_tracker:onboarding_done',
};

export const storage = {
  async setApiKey(key: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.API_KEY, key);
  },

  async getApiKey(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.API_KEY);
  },

  async clearApiKey(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.API_KEY);
  },

  async setAiModel(model: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.AI_MODEL, model);
  },

  async getAiModel(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.AI_MODEL);
  },

  async clearAiModel(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.AI_MODEL);
  },

  async setQuickPrompts(prompts: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.QUICK_PROMPTS, JSON.stringify(prompts));
  },

  async getQuickPrompts(): Promise<string[] | null> {
    const raw = await AsyncStorage.getItem(KEYS.QUICK_PROMPTS);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid quick prompts payload in storage');
    }

    return parsed.filter(item => typeof item === 'string');
  },

  async clearQuickPrompts(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.QUICK_PROMPTS);
  },

  async setUserId(userId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_ID, userId);
  },

  async getUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER_ID);
  },

  async setOnboardingDone(done: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
  },

  async isOnboardingDone(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return value === 'true';
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
