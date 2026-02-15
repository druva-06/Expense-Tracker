# Expense Tracker - Setup Guide

## Quick Start

### 1. Install Dependencies

The project dependencies might have npm cache issues. Here's how to handle it:

**Option A: Use the project as-is and install remaining deps**
```bash
cd expense-tracker-app
npm install --legacy-peer-deps
```

**Option B: Use Yarn instead**
```bash
cd expense-tracker-app
yarn install
```

**Option C: Fix npm cache (if permission errors occur)**
```bash
# Check current user
id -u
# Should output: 501

# Fix npm cache ownership
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"

# Then try again
cd expense-tracker-app
npm install
```

### 2. Start the Development Server

```bash
npm start
# or
expo start
```

This will open Expo Dev Tools in your browser.

### 3. Run on Device/Simulator

**iOS (Mac only):**
- Press `i` in terminal
- Or click "Run on iOS simulator" in Expo Dev Tools

**Android:**
- Press `a` in terminal
- Or click "Run on Android emulator" in Expo Dev Tools
- Make sure Android Studio is installed with an emulator

**Physical Device:**
- Install "Expo Go" app from App Store or Play Store
- Scan the QR code shown in terminal/browser

### 4. Configure OpenAI API Key

1. Get API key from: https://platform.openai.com/api-keys
2. Open the app
3. Go to Settings tab
4. Enter your API key
5. Click "Save API Key"

**Note:** The app works without an API key using basic pattern matching!

## Project Structure

```
expense-tracker-app/
├── src/
│   ├── contexts/
│   │   └── AppContext.tsx          # Global state management
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Dashboard with monthly summary
│   │   ├── ChatScreen.tsx          # AI chat interface
│   │   └── SettingsScreen.tsx      # Configuration
│   ├── services/
│   │   ├── database.ts             # SQLite operations
│   │   └── ai.ts                   # OpenAI integration
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── utils/
│       ├── storage.ts              # AsyncStorage wrapper
│       └── helpers.ts              # Utility functions
├── App.tsx                         # Main entry point
├── package.json                    # Dependencies
└── README.md                       # Documentation
```

## Testing the App

### Test Case 1: Add Expense
1. Go to Chat tab
2. Type: "Spent 250 on coffee"
3. Should show confirmation card with expense details
4. Check Home tab - should see the expense listed

### Test Case 2: Query Expenses
1. Add a few expenses first
2. Type: "How much did I spend this month?"
3. Should show summary with total and breakdown

### Test Case 3: Delete with Undo
1. Add an expense
2. Click "Delete" on the confirmation card
3. Should show "Undo" button
4. Click Undo to restore

### Test Case 4: Without API Key
1. Don't configure API key in Settings
2. Try: "Spent 500 on groceries"
3. Should still work using fallback parser

## Troubleshooting

### Issue: npm install fails with permission errors
**Solution:** Run cache ownership fix (see Option C above)

### Issue: "Unsupported engine" warnings
**Solution:** These are warnings only. The app will work fine. To fix:
```bash
nvm install 20.19.4
nvm use 20.19.4
```

### Issue: Expo command not found
**Solution:** Install Expo CLI globally
```bash
npm install -g expo-cli
```

### Issue: Can't connect to Metro bundler
**Solution:** 
- Make sure no other process is using port 8081
- Try clearing cache: `expo start -c`

### Issue: Database not initializing
**Solution:** 
- Delete app from simulator/emulator
- Reinstall with `expo install`

### Issue: OpenAI API errors
**Solution:**
- Verify API key is correct
- Check you have credits on your OpenAI account
- The app will fall back to basic parser if API fails

## Development Tips

### Hot Reload
- Changes to `.tsx` and `.ts` files reload automatically
- Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS) for dev menu

### Debugging
- Use `console.log()` - output appears in terminal
- React Native Debugger: `Cmd+D` (iOS) > "Debug"
- Expo Dev Tools: Click "Debug" in browser

### Testing on Both Platforms
```bash
# Test iOS
npm run ios

# Test Android
npm run android
```

### Clear Cache
```bash
expo start -c
# or
npm start -- -c
```

## Next Steps

1. ✅ App is running
2. ✅ Add some test expenses
3. ✅ Configure OpenAI API key (optional)
4. ⏭️ Add more features (see README Future Enhancements)
5. ⏭️ Build for production with EAS Build

## Build for Production

### Setup EAS
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build iOS
```bash
eas build --platform ios
```

### Build Android
```bash
eas build --platform android
```

## Questions?

- Check the main README.md for detailed documentation
- Review the code - it's well-commented
- Open an issue on GitHub

---

**Happy expense tracking! 💰**
