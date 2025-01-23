#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error on line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

echo "Starting application restart..."

# Navigate to app directory
cd ~/app || exit

# Backup environment files
echo "Backing up environment files..."
mkdir -p ~/env-backup
cp ~/app/.env ~/env-backup/.env
cp ~/app/dinewell/.env ~/env-backup/dinewell.env
cp ~/app/dinewell/.env.local ~/env-backup/dinewell.env.local


# Check for new commits
echo "Checking for new commits..."
git fetch
if [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]; then
    echo "New commits found. Stashing local changes..."
    git stash
    echo "Pulling changes..."
    git pull origin dinewell
    echo "Reapplying local changes..."
    git stash pop || true
else
    echo "No new commits. Exiting."
    exit 0
fi

# Stop PM2 processes
echo "Stopping PM2 processes..."
pm2 delete all || true

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build applications
echo "Building applications..."
export NODE_OPTIONS="--max-old-space-size=2048"
pnpm run build --filter=!eliza-docs

cd dinewell || exit
echo "Generating Prisma client and migrating database..."
npx prisma generate
pnpm prisma migrate deploy

# Restart applications with PM2
echo "Restarting applications with PM2..."
cd ~/app
pm2 start ecosystem.config.js
pm2 save

echo "Restart complete!"