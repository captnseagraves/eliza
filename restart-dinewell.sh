#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error on line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

echo "Restarting Dinewell applications..."

# Backup environment files
echo "Backing up environment files..."
mkdir -p ~/env-backup
cp ~/app/.env ~/env-backup/.env
cp ~/app/dinewell/.env ~/env-backup/dinewell.env
cp ~/app/dinewell/.env.local ~/env-backup/dinewell.env.local

# Stop PM2 processes
echo "Stopping PM2 processes..."
pm2 delete all || true

# Pull latest changes
echo "Pulling latest changes..."
cd ~/app
git pull origin dinewell

# Restore environment files
echo "Restoring environment files..."
cp ~/env-backup/.env ~/app/.env
cp ~/env-backup/dinewell.env ~/app/dinewell/.env
cp ~/env-backup/dinewell.env.local ~/app/dinewell/.env.local

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the applications
echo "Building applications..."
cd ~/app
export NODE_OPTIONS="--max-old-space-size=2048"
pnpm run build --filter=!eliza-docs

# Build dinewell app
cd dinewell
pnpm install
npx prisma generate
NEXT_TELEMETRY_DISABLED=1 npx next build

# Start applications with PM2
echo "Starting applications..."
cd ~/app
pm2 start ecosystem.config.js
pm2 save

echo "Restart complete! Check the logs using 'pm2 logs'"
