# 📐 Expense Tracker - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPO MOBILE APP                             │
│                    (iOS & Android via React Native)                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│    HOME SCREEN       │  │    CHAT SCREEN       │  │   SETTINGS SCREEN    │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ Monthly Total  │  │  │  │ Chat Messages  │  │  │  │ OpenAI API Key │  │
│  │   ₹12,450      │  │  │  │ • User         │  │  │  │ Configuration  │  │
│  └────────────────┘  │  │  │ • Assistant    │  │  │  └────────────────┘  │
│  ┌────────────────┐  │  │  │ • Cards        │  │  │  ┌────────────────┐  │
│  │ Top Categories │  │  │  └────────────────┘  │  │  │ App Info       │  │
│  │ • Food: ₹5,200 │  │  │  ┌────────────────┐  │  │  │ Version 1.0.0  │  │
│  │ • Transport    │  │  │  │ Text Input     │  │  │  └────────────────┘  │
│  └────────────────┘  │  │  │ + Send Button  │  │  │                      │
│  ┌────────────────┐  │  │  └────────────────┘  │  │                      │
│  │ Recent List    │  │  │                      │  │                      │
│  │ (50 expenses)  │  │  │                      │  │                      │
│  └────────────────┘  │  │                      │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
           │                        │                          │
           └────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       APP CONTEXT             │
                    │  (Global State Management)    │
                    │                               │
                    │  • userId                     │
                    │  • apiKey                     │
                    │  • expenses[]                 │
                    │  • refreshExpenses()          │
                    │  • lastDeletedExpense         │
                    └───────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │  DATABASE       │  │  AI SERVICE     │  │  STORAGE        │
    │  SERVICE        │  │                 │  │  UTILITY        │
    ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
    │ • SQLite DB     │  │ • OpenAI API    │  │ • AsyncStorage  │
    │ • CRUD Ops      │  │ • Intent Parse  │  │ • API Key       │
    │ • Queries       │  │ • Category Map  │  │ • User ID       │
    │ • Indexes       │  │ • Fallback      │  │ • Settings      │
    │                 │  │   Parser        │  │                 │
    │ Methods:        │  │                 │  │ Methods:        │
    │ • addExpense    │  │ Methods:        │  │ • setApiKey     │
    │ • getExpenses   │  │ • parseInput    │  │ • getApiKey     │
    │ • updateExpense │  │ • generateInsight│ │ • setUserId     │
    │ • deleteExpense │  │ • inferCategory │  │ • getUserId     │
    │ • getByCategory │  │                 │  │                 │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │   EXPO SQLITE   │  │  OPENAI GPT-4   │  │  ASYNC STORAGE  │
    │   (Local DB)    │  │  API (Optional) │  │  (Device Store) │
    └─────────────────┘  └─────────────────┘  └─────────────────┘

═══════════════════════════════════════════════════════════════════════

DATA FLOW: Add Expense

1. User types in Chat: "Spent 250 on coffee"
                    │
                    ▼
2. ChatScreen → AI Service.parseInput()
                    │
                    ├─ With API Key ─→ OpenAI GPT-4
                    │                      │
                    │                      ▼
                    │                  JSON Response
                    │                  {
                    │                    intent: "add_expense"
                    │                    amount: 250
                    │                    category: "Food & Dining"
                    │                    date: "2026-02-15"
                    │                  }
                    │
                    └─ Without API Key ─→ Fallback Parser
                                           │
                                           ▼
                                       Regex + Keywords
                                       Same JSON Structure
                    │
                    ▼
3. Database.addExpense() → SQLite
                    │
                    ▼
4. Confirmation Card Displayed
                    │
                    ▼
5. App.refreshExpenses() → Updates Home Screen

═══════════════════════════════════════════════════════════════════════

DATA FLOW: Query Expenses

1. User types: "How much did I spend this month?"
                    │
                    ▼
2. AI Service → Intent: "query_expenses"
                    │
                    ▼
3. Database.getExpenses(filters) → SQLite Query
                    │
                    ▼
4. AI Service.generateInsight(expenses[])
                    │
                    ▼
5. Display: "Total: ₹5,420 across 23 expenses..."

═══════════════════════════════════════════════════════════════════════

TECHNOLOGY STACK

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│ • React Native 0.81.5                                       │
│ • Expo SDK ~54.0                                            │
│ • TypeScript ~5.9                                           │
│ • React Navigation 7.x (Bottom Tabs)                        │
│ • React Native Paper 5.x (Material Design)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STORAGE LAYER                                               │
├─────────────────────────────────────────────────────────────┤
│ • Expo SQLite ~16.0 (Expenses, indexed queries)             │
│ • AsyncStorage (Settings, API key, User ID)                 │
│ • Expo Crypto (UUID generation)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AI/INTELLIGENCE LAYER                                       │
├─────────────────────────────────────────────────────────────┤
│ • OpenAI GPT-4 API (Optional, for NLP)                      │
│ • Fallback Parser (Regex + Keyword matching)                │
│ • Category Inference Engine                                 │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

OFFLINE-FIRST ARCHITECTURE

                    ┌──────────────────┐
                    │   USER ACTION    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  LOCAL STORAGE   │
                    │    (SQLite)      │
                    │  ✅ IMMEDIATE    │
                    │  ✅ NO LATENCY   │
                    │  ✅ ALWAYS WORKS │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   AI PARSING     │
                    │   (Optional)     │
                    │                  │
                    │  Internet? ──Yes──→ OpenAI API
                    │     │                    │
                    │     No                   │
                    │     │                    │
                    │     ▼                    │
                    │  Fallback Parser         │
                    │     │                    │
                    │     └────────┬───────────┘
                    │              │
                    └──────────────┼───────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   UI UPDATE      │
                          │  (Immediate)     │
                          └──────────────────┘

No sync required. No cloud. Pure offline.

═══════════════════════════════════════════════════════════════════════
