export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: string;
  payment_method?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  created_at: number;
  updated_at: number;
}

export type Intent =
  | 'add_expense'
  | 'query_expenses'
  | 'edit_expense'
  | 'delete_expense'
  | 'create_category'
  | 'help'
  | 'unknown';

export type UIHint =
  | 'confirmation_card'
  | 'edit_sheet'
  | 'delete_undo'
  | 'summary_card'
  | 'clarification';

export interface AIResponse {
  intent: Intent;
  user_id: string;
  offline_safe: boolean;
  ui_hint: UIHint;
  data?: {
    expense_id?: string;
    amount?: number;
    currency?: string;
    category?: string;
    payment_method?: string;
    date?: string;
    notes?: string;
  };
  query?: {
    from_date?: string;
    to_date?: string;
    category?: string;
    type?: string;
  };
  response_text: string;
  clarification_question?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ui_hint?: UIHint;
  expense_data?: Partial<Expense>;
}

export const FIXED_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Housing',
  'Utilities',
  'Shopping',
  'Health & Medical',
  'Entertainment',
  'Education',
  'Travel',
  'Subscriptions',
  'Personal Care',
  'Gifts & Donations',
  'Miscellaneous',
] as const;

export type Category = typeof FIXED_CATEGORIES[number];
