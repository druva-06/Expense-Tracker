#!/bin/bash
# Quick Start Script for Expense Tracker App

echo "🚀 Expense Tracker - Quick Start"
echo "================================"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the expense-tracker-app directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
echo ""

# Try npm install with legacy peer deps
if npm install --legacy-peer-deps; then
    echo "✅ Dependencies installed successfully!"
else
    echo "⚠️  npm install failed. Trying with yarn..."
    if command -v yarn &> /dev/null; then
        yarn install
        echo "✅ Dependencies installed with yarn!"
    else
        echo "❌ Installation failed. Please check SETUP.md for troubleshooting."
        exit 1
    fi
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the development server:"
echo "   npm start"
echo ""
echo "2. Run on iOS (Mac only):"
echo "   npm run ios"
echo ""
echo "3. Run on Android:"
echo "   npm run android"
echo ""
echo "4. Configure OpenAI API Key (optional):"
echo "   - Open the app"
echo "   - Go to Settings tab"
echo "   - Enter your API key from: https://platform.openai.com/api-keys"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - SETUP.md (step-by-step guide)"
echo "   - README.md (full documentation)"
echo "   - BUILD_SUMMARY.md (what's been built)"
echo ""
echo "💡 Try your first expense:"
echo "   Open Chat tab and type: 'Spent 250 on coffee'"
echo ""
echo "Happy expense tracking! 💰"
echo ""
