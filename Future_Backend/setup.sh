#!/bin/bash
# =====================================================
# SETUP SCRIPT - Affiliate Courses Platform Backend
# Run: chmod +x setup.sh && ./setup.sh
# =====================================================

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   Affiliate Courses Platform - Setup       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""
echo "📦 Installing dependencies (this may take 2-3 minutes)..."
npm install

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Creating database and running migrations..."
npx prisma migrate dev --name init

echo ""
echo "🌱 Seeding database with test data..."
npx ts-node prisma/seed.ts

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   ✅ SETUP COMPLETE!                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Run the server:  npm run dev                              ║"
echo "║  Server URL:      http://localhost:3000                    ║"
echo "║  Health Check:    http://localhost:3000/health             ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Test Credentials:                                         ║"
echo "║  Admin:   admin@platform.com    / Admin@123456             ║"
echo "║  Manager: manager@platform.com  / Manager@123456           ║"
echo "║  User:    user@platform.com     / User@123456              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
