#!/bin/bash

# Simple JavaScript test runner for CSV functionality

echo "🧪 Running TCG Card Manager CSV Tests"
echo "======================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required to run these tests"
    exit 1
fi

# Run the tests
node csv.test.js

echo ""
echo "Tests completed!"
