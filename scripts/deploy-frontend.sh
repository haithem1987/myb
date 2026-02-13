#!/bin/bash

# Deploy Frontend Admin App to Railway
# This script deploys the Angular admin frontend as a separate service

echo "🚀 Deploying Admin Frontend to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Please run: railway login"
    exit 1
fi

echo "📋 Creating new Railway service for admin frontend..."
echo ""
echo "⚠️  Manual Steps Required:"
echo "1. Go to Railway Dashboard: https://railway.com/project/5602a096-5dec-4261-92b8-ad472934679e"
echo "2. Click '+ New' → 'Empty Service'"
echo "3. Name it: myb-admin"
echo "4. Click on Settings → Generate Domain"
echo "5. Come back here and press Enter to continue..."
read -p "Press Enter when service is created..."

echo ""
echo "📦 Deploying frontend code..."

# Link to the backend project
railway link 5602a096-5dec-4261-92b8-ad472934679e

# Use frontend railway config
export RAILWAY_CONFIG_FILE="railway-frontend.toml"

# Deploy frontend
railway up --detach

echo ""
echo "✅ Frontend deployment initiated!"
echo "📊 Monitor deployment: https://railway.com/project/5602a096-5dec-4261-92b8-ad472934679e"
echo ""
echo "🔗 After deployment completes:"
echo "   1. Go to service settings → Networking"
echo "   2. Copy the generated domain"
echo "   3. Share with your boss!"
