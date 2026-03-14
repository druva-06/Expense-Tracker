import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Expense } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('expenses.db');

    // Create tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        category TEXT NOT NULL,
        payment_method TEXT,
        date TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_user_date ON expenses(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_user_category ON expenses(user_id, category);
    `);
  }

  private generateId(): string {
    return Crypto.randomUUID();
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const timestamp = Date.now();
    const newExpense: Expense = {
      ...expense,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await this.db.runAsync(
      `INSERT INTO expenses (id, user_id, amount, currency, category, payment_method, date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newExpense.id,
        newExpense.user_id,
        newExpense.amount,
        newExpense.currency,
        newExpense.category,
        newExpense.payment_method || null,
        newExpense.date,
        newExpense.notes || null,
        newExpense.created_at,
        newExpense.updated_at,
      ]
    );

    return newExpense;
  }

  async getExpenses(userId: string, filters?: {
    from_date?: string;
    to_date?: string;
    category?: string;
  }): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params: any[] = [userId];

    if (filters?.from_date) {
      query += ' AND date >= ?';
      params.push(filters.from_date);
    }

    if (filters?.to_date) {
      query += ' AND date <= ?';
      params.push(filters.to_date);
    }

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await this.db.getAllAsync<Expense>(query, params);
    return result;
  }

  async getExpenseById(id: string, userId: string): Promise<Expense | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<Expense>(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return result || null;
  }

  async findExpense(
    userId: string,
    date: string,
    amount: number,
    category?: string
  ): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM expenses WHERE user_id = ? AND date = ? AND amount = ?';
    const params: any[] = [userId, date, amount];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const result = await this.db.getAllAsync<Expense>(query, params);
    return result;
  }

  async updateExpense(id: string, userId: string, updates: Partial<Expense>): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.payment_method !== undefined) {
      fields.push('payment_method = ?');
      values.push(updates.payment_method);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id, userId);

    const query = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    const result = await this.db.runAsync(query, values);

    return result.changes > 0;
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return result.changes > 0;
  }

  async getTotalByCategory(userId: string, fromDate?: string, toDate?: string): Promise<{
    category: string;
    total: number;
  }[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (fromDate) {
      query += ' AND date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      query += ' AND date <= ?';
      params.push(toDate);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const result = await this.db.getAllAsync<{ category: string; total: number }>(query, params);
    return result;
  }

  async getRecentExpenses(userId: string, limit: number = 10): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<Expense>(
      `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
      [userId, limit]
    );

    return result;
  }

  async replaceExpensesForUser(
    userId: string,
    expenses: Array<
      Pick<
        Expense,
        'id' | 'amount' | 'currency' | 'category' | 'payment_method' | 'date' | 'notes' | 'created_at' | 'updated_at'
      >
    >
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      await this.db.runAsync('DELETE FROM expenses WHERE user_id = ?', [userId]);

      for (const expense of expenses) {
        await this.db.runAsync(
          `INSERT INTO expenses (id, user_id, amount, currency, category, payment_method, date, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expense.id,
            userId,
            expense.amount,
            expense.currency || 'INR',
            expense.category,
            expense.payment_method || null,
            expense.date,
            expense.notes || null,
            expense.created_at,
            expense.updated_at,
          ]
        );
      }

      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }
}

export const db = new DatabaseService();
