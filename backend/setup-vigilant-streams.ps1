# Vigilant MEV Protection - Quick Setup Script for Windows
# This script sets up the complete Somnia Data Streams integration

Write-Host "🚀 Setting up Vigilant MEV Protection with Somnia Data Streams..." -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Check environment variables
if (-not $env:RPC_URL -or -not $env:PRIVATE_KEY) {
    Write-Host "❌ Missing environment variables!" -ForegroundColor Red
    Write-Host "Please set:" -ForegroundColor Yellow
    Write-Host '  $env:RPC_URL="https://dream-rpc.somnia.network"' -ForegroundColor Yellow
    Write-Host '  $env:PRIVATE_KEY="0xYOUR_FUNDED_PRIVATE_KEY"' -ForegroundColor Yellow
    Write-Host '  $env:WS_URL="wss://dream-rpc.somnia.network"  # Optional' -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables found" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install @somnia-chain/streams viem dotenv

# Compile TypeScript
Write-Host "🔨 Compiling TypeScript..." -ForegroundColor Blue
npx tsc --noEmit

# Register schemas
Write-Host "📋 Registering Vigilant schemas on Somnia Network..." -ForegroundColor Blue
npx tsx scripts/register-vigilant-schemas.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schemas registered successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Schema registration failed" -ForegroundColor Red
    exit 1
}

# Run demo
Write-Host "🎭 Running Vigilant MEV Protection demo..." -ForegroundColor Blue
Write-Host "This will show the complete real-time workflow..." -ForegroundColor Cyan
npx tsx scripts/vigilant-demo.ts

Write-Host ""
Write-Host "🎉 Setup complete! Vigilant MEV Protection is ready with Somnia Data Streams!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host "  • Start simulator nodes: npm run vigilant-simulator" -ForegroundColor White
Write-Host "  • Run demo again: npm run vigilant-demo" -ForegroundColor White
Write-Host "  • Register schemas: npm run register-vigilant-schemas" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation: See SOMNIA_STREAMS_INTEGRATION.md for details" -ForegroundColor Cyan