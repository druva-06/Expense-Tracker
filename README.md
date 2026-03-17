# Expense Tracker App

A React Native + Expo mobile app for tracking expenses through a chat-first workflow, with local SQLite storage and optional OpenAI-powered parsing.

## Current status

- Cross-platform app (iOS and Android)
- Local-first data storage using Expo SQLite
- 4 main tabs/screens: `Chat`, `Home`, `History`, `Settings`
- Chat actions currently require a valid OpenAI API key
- Backup and restore (JSON export/import) available in Settings
- Voice input supported in development builds (not Expo Go)

## Features

- Chat-based expense entry and queries
- Edit and delete with undo support
- Monthly/year/all-time filtering and search in History
- Category breakdown and totals on Home
- Local backup export and import/replace
- API key management in Settings
- Configurable AI model and customizable quick prompts (up to 3)

## Screens

- **Chat**: Send natural-language requests, view confirmations, edit/delete entries
- **Home**: Period totals and category donut breakdown
- **History**: Search, date-range filters, grouped transactions, inline edit/delete
- **Settings**: OpenAI key/model, quick prompt customization, backup/restore, app info

## Tech stack

- React Native `0.81.5`
- Expo SDK `~54.0.33`
- TypeScript `~5.9.2`
- Expo SQLite `~16.0.0`
- React Navigation `^7.0.12`
- React Native Paper `^5.12.3`
- AsyncStorage `2.2.0`
- Expo speech recognition (voice input): `^3.1.1`

## Getting started

### Prerequisites

- Node.js (recommended: v20+)
- npm or Yarn
- iOS Simulator (macOS) and/or Android Emulator

### Install

```bash
cd expense-tracker-app
npm install --legacy-peer-deps
```

If you prefer Yarn:

```bash
yarn install
```

### Run

```bash
npm start
```

Useful script commands:

```bash
npm run ios
npm run android
npm run web
```

Or run the quick setup helper:

```bash
./quickstart.sh
```

## OpenAI setup

1. Open the app
2. Go to `Settings`
3. Add your OpenAI API key (`sk-...`)
4. (Optional) Set your OpenAI model (default: `gpt-4o-mini`)

Without a valid API key, chat add/query/edit/delete actions are blocked and the assistant will prompt you to configure the key.

## Voice input notes

- Voice input is wired through `expo-speech-recognition`
- It works in a development build
- It does **not** work in Expo Go

## Data model

```ts
{
  id: string
  user_id: string
  amount: number
  currency: string
  category: string
  payment_method?: string
  date: string // YYYY-MM-DD
  notes?: string
  created_at: number
  updated_at: number
}
```

Fixed categories:

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

## Project structure

```text
expense-tracker-app/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   ├── types/
│   └── utils/
├── App.tsx
├── README.md
├── SETUP.md
└── BUILD_SUMMARY.md
```

## Security and privacy

- Expense data is stored locally on device (SQLite)
- API key is stored in AsyncStorage on device
- No backend data sync is implemented in this repo

## Documentation

- `SETUP.md`: environment setup and troubleshooting
- `BUILD_SUMMARY.md`: build overview
- `ARCHITECTURE.md`: architecture and flow diagrams

## License

MIT
