import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: '@expense_tracker:api_key',
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
