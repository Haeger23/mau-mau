#!/bin/bash
# Run tests once without watch mode

cd "$(dirname "$0")"

echo "🧪 Running all tests..."
echo ""

# Start dev server in background
echo "Starting dev server..."
npm start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server..."
sleep 5

# Run tests
echo ""
echo "Running tests..."
npm test 2>&1 | grep -A 100 "RUN"

# Cleanup
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Test run complete"
