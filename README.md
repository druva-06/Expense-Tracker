# Expense Tracker - AI-Powered Mobile App

An offline-first expense tracking mobile app (iOS & Android) built with React Native and Expo. Features a chat-based AI assistant for effortless expense entry.

## 🎯 Features

- **Chat-Based Interface**: Natural language expense entry ("Spent 250 on coffee")
- **AI-Powered**: OpenAI integration for intelligent expense parsing
- **Offline-First**: All data stored locally with SQLite
- **Smart Category Mapping**: Automatic categorization of expenses
- **Monthly Insights**: View spending by category and time period
- **Edit & Delete with Undo**: Safe expense management
- **Cross-Platform**: Runs on both iOS and Android

## 🏗️ Architecture

- **Frontend**: React Native + Expo (TypeScript)
- **Storage**: Expo SQLite (offline-first)
- **AI**: OpenAI API (with fallback parser)
- **Navigation**: React Navigation (Bottom Tabs)
- **UI**: React Native Paper (Material Design)
- **State**: React Context API

## 📱 Screens

1. **Home**: Monthly summary, category breakdown, recent expenses
2. **Chat**: AI assistant for adding/querying expenses
3. **Settings**: OpenAI API key configuration

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   cd expense-tracker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Configuration

1. **OpenAI API Key** (Optional)
   - Get your API key from: https://platform.openai.com/api-keys
   - Enter it in the Settings screen of the app
   - Without an API key, the app uses basic pattern matching

## 📊 Data Model

### Expense
```typescript
{
  id: string           // UUID
  user_id: string      // Auto-generated user ID
  amount: number       // Expense amount
  currency: string     // Default: "INR"
  category: string     // One of 14 fixed categories
  payment_method?: string  // Optional
  date: string         // YYYY-MM-DD
  notes?: string       // Optional
  created_at: number   // Timestamp
  updated_at: number   // Timestamp
}
```

### Fixed Categories
- Food & Dining
- Groceries
- Transport
- Housing
- Utilities
- Shopping
- Health & Medical
- Entertainment
- Education
- Travel
- Subscriptions
- Personal Care
- Gifts & Donations
- Miscellaneous

## 🤖 AI Assistant Capabilities

The AI assistant supports these intents:

1. **Add Expense**: "Spent 250 on coffee", "Paid 500 for Uber"
2. **Query Expenses**: "How much did I spend this month?", "Show groceries"
3. **Edit Expense**: "Change that to 300"
4. **Delete Expense**: "Delete yesterday's expense"
5. **Help**: General assistance

### Example Conversations

```
User: "Spent 250 on coffee"
App: "Added ₹250 under Food & Dining for today. You can edit or delete this if needed."

User: "How much on transport this month?"
App: "Total: ₹1,450 across 8 expenses. Highest spending: Transport (₹1,450)."

User: "Delete that"
App: "Expense deleted. You can undo this action." [Undo button shown]
```

## 🗂️ Project Structure

```
expense-tracker-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context (AppContext)
│   ├── screens/         # Main screens (Home, Chat, Settings)
│   ├── services/        # Business logic (AI, Database)
│   ├── types/           # TypeScript types
│   └── utils/           # Helper functions (storage, formatting)
├── App.tsx              # Main app entry point
├── package.json         # Dependencies
└── README.md            # This file
```

## 🔧 Key Services

### DatabaseService (`src/services/database.ts`)
- SQLite operations (CRUD)
- Expense queries with filters
- Category totals and insights

### AIService (`src/services/ai.ts`)
- OpenAI integration
- Intent classification
- Fallback parser (works offline)
- Category inference

### Storage (`src/utils/storage.ts`)
- AsyncStorage wrapper
- API key management
- User ID persistence

## 📝 Development Notes

### Offline-First Principles
- All expenses stored locally in SQLite
- AI parsing works with fallback when API unavailable
- No cloud sync (pure offline)
- Idempotent operations

### UX Principles
- Minimize cognitive load
- Confirmation cards for adds
- Undo for destructive actions
- Clear error messages
- No forms unless necessary

## 🧪 Testing

Run on iOS:
```bash
npm run ios
```

Run on Android:
```bash
npm run android
```

## 📦 Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

Note: Requires Expo Application Services (EAS) account

## 🔐 Security

- API keys stored in AsyncStorage (encrypted by OS)
- No hardcoded secrets
- All data stays on device
- No telemetry or tracking

## 🛠️ Tech Stack

- **React Native** 0.81.5
- **Expo** ~54.0
- **TypeScript** ~5.9
- **Expo SQLite** ~16.0
- **React Navigation** ^7.0
- **React Native Paper** ^5.12
- **OpenAI API** (gpt-4)

## 📈 Future Enhancements

- [ ] Voice input support
- [ ] Cloud sync (optional)
- [ ] Budget tracking
- [ ] Recurring expenses
- [ ] Export to CSV/PDF
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] Multi-currency support
- [ ] Receipt photo capture

## 🐛 Known Issues

- None currently

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 💬 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using React Native and Expo**
