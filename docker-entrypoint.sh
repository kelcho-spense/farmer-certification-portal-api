#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 3

echo "Running database seed..."
node dist/database/seed.js || echo "Seed skipped or already applied"

echo "Starting application..."
exec node dist/main.js
