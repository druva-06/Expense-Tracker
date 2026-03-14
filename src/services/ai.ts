import { AIResponse, FIXED_CATEGORIES, Intent } from '../types';
import { getDateRangeForPeriod } from '../utils/helpers';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class AIService {
  private apiKey: string = '';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  async parseExpenseInput(userInput: string, userId: string): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.createFallbackResponse(userInput, userId);
    }

    try {
      const systemPrompt = `You are an AI expense tracking assistant. Extract expense information from user input.

RULES:
1. NEVER guess the amount - if not provided, set intent to "help" and ask for it
2. Date defaults to TODAY (${this.getTodayDate()}) unless specified
3. Currency defaults to INR
4. Map categories to one of these ONLY: ${FIXED_CATEGORIES.join(', ')}
5. Preserve user detail in notes (merchant/item/reason like "movie", "uber ride", "coffee")
6. Respond with JSON + natural language text

INTENTS:
- add_expense: User wants to add new expense
- edit_expense: User wants to modify existing expense
- delete_expense: User wants to remove expense
- query_expenses: User wants to view/analyze expenses
- help: Unclear input or missing required fields

OUTPUT FORMAT:
{
  "intent": "<intent>",
  "user_id": "${userId}",
  "offline_safe": true,
  "ui_hint": "confirmation_card | edit_sheet | delete_undo | summary_card | clarification",
  "data": {
    "amount": <number>,
    "currency": "INR",
    "category": "<category>",
    "payment_method": "<optional>",
    "date": "YYYY-MM-DD",
    "notes": "<optional>"
  },
  "response_text": "Natural language response",
  "clarification_question": "<if needed>"
}

Examples:
Input: "Spent 250 on coffee"
Output: {"intent": "add_expense", "ui_hint": "confirmation_card", "data": {"amount": 250, "currency": "INR", "category": "Food & Dining", "date": "${this.getTodayDate()}"}, "response_text": "Added ₹250 under Food & Dining for today. You can edit or delete this if needed."}

Input: "Coffee"
Output: {"intent": "help", "ui_hint": "clarification", "response_text": "How much did you spend on coffee?", "clarification_question": "How much did you spend on coffee?"}

Input: "Edit that to 300"
Output: {"intent": "edit_expense", "ui_hint": "edit_sheet", "data": {"amount": 300}, "response_text": "Updated the expense to ₹300."}

Now parse this input: "${userInput}"`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse: AIResponse = JSON.parse(data.choices[0].message.content);

      aiResponse.user_id = userId;
      aiResponse.offline_safe = true;
      if (aiResponse.intent === 'add_expense' && aiResponse.data && !aiResponse.data.notes) {
        aiResponse.data.notes = this.extractExpenseNotes(userInput);
      }

      return aiResponse;
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.createFallbackResponse(userInput, userId);
    }
  }

  private createFallbackResponse(userInput: string, userId: string): AIResponse {
    const lowerInput = userInput.toLowerCase();
    const amountMatch = userInput.match(/(\d+(?:\.\d{1,2})?)/);
    const hasQueryMarker =
      lowerInput.includes('?') ||
      lowerInput.includes('how much') ||
      lowerInput.includes('total') ||
      lowerInput.includes('show') ||
      lowerInput.includes('list') ||
      lowerInput.includes('summary') ||
      lowerInput.includes('report') ||
      lowerInput.includes('what did i spend') ||
      lowerInput.includes('spending') ||
      lowerInput.includes('expenses in') ||
      lowerInput.includes('expenses for');

    if (amountMatch && !hasQueryMarker) {
      const amount = parseFloat(amountMatch[1]);
      const category = this.inferCategory(userInput);
      const notes = this.extractExpenseNotes(userInput);

      return {
        intent: 'add_expense',
        user_id: userId,
        offline_safe: true,
        ui_hint: 'confirmation_card',
        data: {
          amount,
          currency: 'INR',
          category,
          date: this.getTodayDate(),
          notes,
        },
        response_text: `Added ₹${amount} under ${category} for today. You can edit or delete this if needed.`,
      };
    }

    if (hasQueryMarker || lowerInput.includes('spent this month') || lowerInput.includes('spent this year')) {
      const parsedDateRange = this.parseQueryDateRange(lowerInput);
      return {
        intent: 'query_expenses',
        user_id: userId,
        offline_safe: true,
        ui_hint: 'summary_card',
        response_text: parsedDateRange.periodLabel
          ? `Let me fetch your expense summary for ${parsedDateRange.periodLabel}...`
          : 'Let me fetch your expense summary...',
        query: {
          from_date: parsedDateRange.fromDate,
          to_date: parsedDateRange.toDate,
        },
      };
    }

    if (lowerInput.includes('delete') || lowerInput.includes('remove')) {
      return {
        intent: 'delete_expense',
        user_id: userId,
        offline_safe: true,
        ui_hint: 'clarification',
        response_text: 'Which expense would you like to delete? Please specify the date and amount.',
        clarification_question: 'Which expense would you like to delete?',
      };
    }

    if (lowerInput.includes('edit') || lowerInput.includes('change') || lowerInput.includes('update')) {
      return {
        intent: 'edit_expense',
        user_id: userId,
        offline_safe: true,
        ui_hint: 'clarification',
        response_text: 'Which expense would you like to edit?',
        clarification_question: 'Which expense would you like to edit?',
      };
    }

    return {
      intent: 'help',
      user_id: userId,
      offline_safe: true,
      ui_hint: 'clarification',
      response_text: 'I can help you track expenses. Try: "Spent 250 on coffee" or "How much did I spend this month?"',
      clarification_question: 'What would you like to do?',
    };
  }

  private parseQueryDateRange(input: string): {
    fromDate?: string;
    toDate?: string;
    periodLabel?: string;
  } {
    const monthMap: { name: string; short: string; month: number }[] = [
      { name: 'january', short: 'Jan', month: 1 },
      { name: 'february', short: 'Feb', month: 2 },
      { name: 'march', short: 'Mar', month: 3 },
      { name: 'april', short: 'Apr', month: 4 },
      { name: 'may', short: 'May', month: 5 },
      { name: 'june', short: 'Jun', month: 6 },
      { name: 'july', short: 'Jul', month: 7 },
      { name: 'august', short: 'Aug', month: 8 },
      { name: 'september', short: 'Sep', month: 9 },
      { name: 'october', short: 'Oct', month: 10 },
      { name: 'november', short: 'Nov', month: 11 },
      { name: 'december', short: 'Dec', month: 12 },
    ];

    const now = new Date();
    const yearMatch = input.match(/\b(19|20)\d{2}\b/);
    const selectedYear = yearMatch ? parseInt(yearMatch[0], 10) : now.getFullYear();
    const matchedMonth = monthMap.find(
      monthInfo => input.includes(monthInfo.name) || input.includes(monthInfo.short.toLowerCase())
    );

    if (input.includes('last month')) {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const range = getDateRangeForPeriod(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1);
      const label = `${monthMap[lastMonthDate.getMonth()].short} ${lastMonthDate.getFullYear()}`;
      return { fromDate: range.fromDate, toDate: range.toDate, periodLabel: label };
    }

    if (input.includes('this month')) {
      const range = getDateRangeForPeriod(now.getFullYear(), now.getMonth() + 1);
      const label = `${monthMap[now.getMonth()].short} ${now.getFullYear()}`;
      return { fromDate: range.fromDate, toDate: range.toDate, periodLabel: label };
    }

    if (input.includes('this year')) {
      const range = getDateRangeForPeriod(now.getFullYear(), null);
      return { fromDate: range.fromDate, toDate: range.toDate, periodLabel: `${now.getFullYear()}` };
    }

    if (matchedMonth) {
      const range = getDateRangeForPeriod(selectedYear, matchedMonth.month);
      return {
        fromDate: range.fromDate,
        toDate: range.toDate,
        periodLabel: `${matchedMonth.short} ${selectedYear}`,
      };
    }

    if (yearMatch) {
      const range = getDateRangeForPeriod(selectedYear, null);
      return { fromDate: range.fromDate, toDate: range.toDate, periodLabel: `${selectedYear}` };
    }

    return {};
  }

  private inferCategory(input: string): string {
    const lowerInput = input.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Food & Dining': ['food', 'coffee', 'restaurant', 'lunch', 'dinner', 'breakfast', 'meal', 'cafe', 'eat'],
      'Groceries': ['grocery', 'groceries', 'supermarket', 'vegetables', 'fruits'],
      'Transport': ['uber', 'taxi', 'bus', 'train', 'metro', 'fuel', 'petrol', 'diesel', 'auto', 'ola', 'transport'],
      'Housing': ['rent', 'mortgage', 'housing'],
      'Utilities': ['electricity', 'water', 'gas', 'utility', 'bill'],
      'Shopping': ['shopping', 'clothes', 'fashion', 'amazon', 'flipkart'],
      'Health & Medical': ['doctor', 'medicine', 'pharmacy', 'medical', 'health', 'hospital'],
      'Entertainment': ['movie', 'entertainment', 'netflix', 'spotify', 'game'],
      'Education': ['course', 'book', 'education', 'tuition', 'school'],
      'Travel': ['flight', 'hotel', 'travel', 'vacation', 'trip'],
      'Subscriptions': ['subscription', 'prime', 'membership'],
      'Personal Care': ['salon', 'spa', 'grooming', 'haircut'],
      'Gifts & Donations': ['gift', 'donation', 'charity'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return category;
      }
    }

    return 'Miscellaneous';
  }

  private extractExpenseNotes(input: string): string | undefined {
    const cleaned = input
      .toLowerCase()
      .replace(/\b(spent|pay|paid|for|on|rs|inr|rupees?|expense|add)\b/g, ' ')
      .replace(/\d+(?:\.\d{1,2})?/g, ' ')
      .replace(/[^\w\s&-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned || cleaned.length < 2) {
      return undefined;
    }

    return cleaned
      .split(' ')
      .map(word => (word.length > 2 ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
      .join(' ');
  }

  async generateInsight(expenses: any[], queryType?: string): Promise<string> {
    if (expenses.length === 0) {
      return "You haven't recorded any expenses for this period.";
    }

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return `Total: ₹${total.toFixed(2)} across ${expenses.length} expense${expenses.length > 1 ? 's' : ''}. Highest spending: ${topCategory[0]} (₹${topCategory[1].toFixed(2)}).`;
  }
}

export const aiService = new AIService();
