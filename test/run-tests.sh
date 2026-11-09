#!/bin/bash

# Test Runner for TCG Card Manager
# This script runs all tests to ensure functionality doesn't regress

set -e  # Exit on any error

echo "🧪 TCG Card Manager Test Suite"
echo "=============================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required to run tests"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo "📋 Running CSV Tests..."
echo "----------------------"

# Run CSV tests
if node test/csv.test.js; then
    echo ""
    echo "✅ CSV Tests: PASSED"
else
    echo ""
    echo "❌ CSV Tests: FAILED"
    exit 1
fi

echo ""
echo "🃏 Running Catalog Matching Tests..."
echo "----------------------------------"
if node test/catalog-matching.test.js; then
    echo ""
    echo "✅ Catalog Matching Tests: PASSED"
else
    echo ""
    echo "❌ Catalog Matching Tests: FAILED"
    exit 1
fi

echo ""
echo "💰 Running Pricing Tests..."
echo "---------------------------"

# Run pricing tests
if node test/pricing.test.js; then
    echo ""
    echo "✅ Pricing Tests: PASSED"
else
    echo ""
    echo "❌ Pricing Tests: FAILED"
    exit 1
fi

echo ""
echo "🔗 Running Integration Tests..."
echo "-------------------------------"

# Run integration tests
if node test/integration.test.js; then
    echo ""
    echo "✅ Integration Tests: PASSED"
else
    echo ""
    echo "❌ Integration Tests: FAILED"
    exit 1
fi

echo ""
echo "🎯 Running Pricing Integration Tests..."
echo "--------------------------------------"

# Run pricing integration tests
if node test/pricing-integration.test.js; then
    echo ""
    echo "✅ Pricing Integration Tests: PASSED"
else
    echo ""
    echo "❌ Pricing Integration Tests: FAILED"
    exit 1
fi

echo ""
echo "🎉 All Tests Passed!"
echo "==================="
echo ""
echo "The TCG Card Manager functionality is working correctly."
echo "Key areas tested:"
echo "  • CSV parsing and export functionality"
echo "  • TCG pricing rule calculations"
echo "  • Import/export integration workflows"
echo "  • Full pricing workflow testing"
echo ""
echo "To run individual tests:"
echo "  node test/csv.test.js"
echo "  node test/pricing.test.js"
echo "  node test/integration.test.js"
echo "  node test/pricing-integration.test.js"
echo ""
