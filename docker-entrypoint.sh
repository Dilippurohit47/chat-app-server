#!/bin/sh
set -e

echo "⏳ Waiting for Postgres..."

until nc -z postgres 5432; do
  sleep 1
done

echo "✅ Postgres is up"

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Waiting for redis..."

until nc -z redis 6379; do
  sleep 1
done

echo "redis is ready "

echo "✅ Starting Node app..."
npm start