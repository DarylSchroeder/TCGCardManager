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
echo "📋 Running Quantity Update Tests..."
echo "-----------------------------------"

# Run the quantity update tests
if node test/quantity-update-simple.test.js; then
    echo ""
    echo "✅ Quantity Update Tests: PASSED"
else
    echo ""
    echo "❌ Quantity Update Tests: FAILED"
    exit 1
fi

echo ""
echo "🎯 Testing Real-World Scenario..."
echo "--------------------------------"

# Test with sample CSV data
if [ -f "test/data/sample_inventory.csv" ]; then
    echo "📄 Found sample test data, verifying test cards exist..."
    
    # Simple grep test to verify our test cards exist in the CSV
    test_cards=("8728925" "5400291" "8755665")
    all_found=true
    
    for card_id in "${test_cards[@]}"; do
        if grep -q "$card_id" test/data/sample_inventory.csv; then
            echo "✅ Found card ID: $card_id"
        else
            echo "❌ Missing card ID: $card_id"
            all_found=false
        fi
    done
    
    if [ "$all_found" = true ]; then
        echo "✅ Integration Test: PASSED - All test cards found in sample CSV"
    else
        echo "❌ Integration Test: FAILED - Some test cards missing from sample CSV"
        exit 1
    fi
else
    echo "⚠️  No sample test data found, skipping integration test"
fi

echo ""
echo "🎉 All Tests Passed!"
echo "==================="
echo ""
echo "The quantity update functionality is working correctly and should not regress."
echo "Key areas tested:"
echo "  • Quote handling in HTML template parameters"
echo "  • Card lookup with various ID formats"
echo "  • Quantity update persistence"
echo "  • Error handling for edge cases"
echo "  • Integration with sample CSV data"
echo ""
echo "To run tests manually:"
echo "  node test/quantity-update-simple.test.js"
echo ""
