#!/bin/bash

# Vigilant MEV Protection - Quick Setup Script
# This script sets up the complete Somnia Data Streams integration

echo "🚀 Setting up Vigilant MEV Protection with Somnia Data Streams..."
echo "=================================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check environment variables
if [ -z "$RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Missing environment variables!"
    echo "Please set:"
    echo "  export RPC_URL=https://dream-rpc.somnia.network"
    echo "  export PRIVATE_KEY=0xYOUR_FUNDED_PRIVATE_KEY"
    echo "  export WS_URL=wss://dream-rpc.somnia.network  # Optional"
    exit 1
fi

echo "✅ Environment variables found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install @somnia-chain/streams viem dotenv

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npx tsc --noEmit

# Register schemas
echo "📋 Registering Vigilant schemas on Somnia Network..."
npx ts-node scripts/register-vigilant-schemas.ts

if [ $? -eq 0 ]; then
    echo "✅ Schemas registered successfully!"
else
    echo "❌ Schema registration failed"
    exit 1
fi

# Run demo
echo "🎭 Running Vigilant MEV Protection demo..."
echo "This will show the complete real-time workflow..."
npx ts-node scripts/vigilant-demo.ts

echo ""
echo "🎉 Setup complete! Vigilant MEV Protection is ready with Somnia Data Streams!"
echo ""
echo "📚 Next steps:"
echo "  • Start simulator nodes: npx ts-node src/simulatorNode.ts"
echo "  • Run demo again: npx ts-node scripts/vigilant-demo.ts"
echo "  • Integrate with frontend: Update useVigilantStreams hook"
echo ""
echo "📖 Documentation: See SOMNIA_STREAMS_INTEGRATION.md for details"