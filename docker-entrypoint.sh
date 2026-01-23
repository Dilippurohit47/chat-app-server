#!/bin/sh
set -e  # exit immediately if a command fails

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Starting Node app..."
npm start