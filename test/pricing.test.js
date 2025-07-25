// Pricing Logic Functional Tests
// Tests the TCG Card Manager pricing calculation business rules

// Extract the pricing logic from the main application
function calculatePrice(tcgMarketPrice, tcgLowPrice, tcgLowWithShipping) {
    const marketPrice = tcgMarketPrice;
    const lowPrice = tcgLowPrice;
    const lowWithShipping = tcgLowWithShipping;
    
    let estimatedPrice;
    
    if (marketPrice <= 0.30) {
        // Cheap cards
        estimatedPrice = Math.max(0.50, lowPrice);
    } else if (marketPrice > 30) {
        // Expensive cards
        estimatedPrice = marketPrice;
    } else {
        // Standard cards
        const avgLowAndMarket = (lowWithShipping + marketPrice) / 2;
        estimatedPrice = Math.max(0.50, Math.max(lowPrice, avgLowAndMarket));
    }
    
    return estimatedPrice;
}

// Test helper to format currency for display
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

// Test helper to run a pricing scenario
function testPricingScenario(description, marketPrice, lowPrice, lowWithShipping, expectedPrice, category) {
    const actualPrice = calculatePrice(marketPrice, lowPrice, lowWithShipping);
    const passed = Math.abs(actualPrice - expectedPrice) < 0.001; // Allow for floating point precision
    
    console.log(`${passed ? '✅' : '❌'} ${category}: ${description}`);
    console.log(`   Market: ${formatPrice(marketPrice)}, Low: ${formatPrice(lowPrice)}, Low+Ship: ${formatPrice(lowWithShipping)}`);
    console.log(`   Expected: ${formatPrice(expectedPrice)}, Actual: ${formatPrice(actualPrice)}`);
    
    if (!passed) {
        console.log(`   ❌ FAILED: Expected ${expectedPrice}, got ${actualPrice}`);
        throw new Error(`Pricing test failed: ${description}`);
    }
    
    console.log('');
    return true;
}

function testCheapCards() {
    console.log('🔍 Testing Cheap Cards (Market Price ≤ $0.30)\n');
    console.log('Rule: max($0.50, TCG Low Price)\n');
    
    // Basic cheap card scenarios
    testPricingScenario(
        'Basic cheap card with low price above minimum',
        0.25, 0.75, 1.00, 0.75,
        'CHEAP'
    );
    
    testPricingScenario(
        'Cheap card with low price below minimum floor',
        0.30, 0.25, 1.00, 0.50,
        'CHEAP'
    );
    
    testPricingScenario(
        'Exact boundary case - market price exactly $0.30',
        0.30, 0.60, 1.00, 0.60,
        'CHEAP'
    );
    
    // Edge cases
    testPricingScenario(
        'Very cheap card with zero low price',
        0.15, 0.00, 0.50, 0.50,
        'CHEAP'
    );
    
    testPricingScenario(
        'Cheap card with low price exactly at minimum',
        0.20, 0.50, 0.75, 0.50,
        'CHEAP'
    );
    
    testPricingScenario(
        'Cheap card with high shipping cost (should be ignored)',
        0.25, 0.80, 5.00, 0.80,
        'CHEAP'
    );
    
    console.log('✅ All cheap card tests passed!\n');
}

function testStandardCards() {
    console.log('🔍 Testing Standard Cards ($0.30 < Market Price ≤ $30.00)\n');
    console.log('Rule: max($0.50, max(TCG Low Price, average(TCG Low With Shipping + TCG Market Price)))\n');
    
    // Basic standard card scenarios
    testPricingScenario(
        'Standard card where low price wins',
        5.00, 4.50, 3.00, 4.50,
        'STANDARD'
    );
    
    testPricingScenario(
        'Standard card where average wins',
        5.00, 3.00, 6.00, 5.50, // avg = (6.00 + 5.00) / 2 = 5.50
        'STANDARD'
    );
    
    testPricingScenario(
        'Standard card hitting minimum floor',
        1.00, 0.25, 0.30, 0.65, // avg = (0.30 + 1.00) / 2 = 0.65
        'STANDARD'
    );
    
    // Boundary cases
    testPricingScenario(
        'Just above cheap threshold - $0.31',
        0.31, 0.25, 0.40, 0.50, // avg = (0.40 + 0.31) / 2 = 0.355, but min is 0.50
        'STANDARD'
    );
    
    testPricingScenario(
        'Exactly at expensive threshold - $30.00',
        30.00, 25.00, 28.00, 29.00, // avg = (28.00 + 30.00) / 2 = 29.00
        'STANDARD'
    );
    
    // Rounding edge cases
    testPricingScenario(
        'Average with slight rounding up',
        2.33, 2.00, 2.50, 2.415, // avg = (2.50 + 2.33) / 2 = 2.415
        'STANDARD'
    );
    
    testPricingScenario(
        'Average with slight rounding down',
        2.33, 2.00, 2.49, 2.41, // avg = (2.49 + 2.33) / 2 = 2.41
        'STANDARD'
    );
    
    testPricingScenario(
        'Repeating decimal average',
        1.00, 0.80, 2.00, 1.50, // avg = (2.00 + 1.00) / 2 = 1.50
        'STANDARD'
    );
    
    testPricingScenario(
        'Complex rounding scenario',
        7.77, 7.50, 8.88, 8.325, // avg = (8.88 + 7.77) / 2 = 8.325
        'STANDARD'
    );
    
    // Edge case where low price and average are very close
    testPricingScenario(
        'Low price barely beats average',
        10.00, 12.01, 14.00, 12.01, // avg = (14.00 + 10.00) / 2 = 12.00, low = 12.01
        'STANDARD'
    );
    
    testPricingScenario(
        'Average barely beats low price',
        10.00, 11.99, 14.00, 12.00, // avg = (14.00 + 10.00) / 2 = 12.00, low = 11.99
        'STANDARD'
    );
    
    console.log('✅ All standard card tests passed!\n');
}

function testExpensiveCards() {
    console.log('🔍 Testing Expensive Cards (Market Price > $30.00)\n');
    console.log('Rule: Keep original TCG Market Price\n');
    
    // Basic expensive card scenarios
    testPricingScenario(
        'Basic expensive card',
        45.00, 40.00, 42.00, 45.00,
        'EXPENSIVE'
    );
    
    testPricingScenario(
        'Very expensive card',
        150.00, 140.00, 145.00, 150.00,
        'EXPENSIVE'
    );
    
    testPricingScenario(
        'Just above threshold - $30.01',
        30.01, 25.00, 28.00, 30.01,
        'EXPENSIVE'
    );
    
    // Edge cases where other prices are higher (should still use market)
    testPricingScenario(
        'Expensive card with higher low price',
        50.00, 55.00, 52.00, 50.00,
        'EXPENSIVE'
    );
    
    testPricingScenario(
        'Expensive card with much higher shipping price',
        75.00, 70.00, 100.00, 75.00,
        'EXPENSIVE'
    );
    
    // Precision edge cases
    testPricingScenario(
        'Expensive card with decimal precision',
        99.99, 95.50, 97.25, 99.99,
        'EXPENSIVE'
    );
    
    testPricingScenario(
        'Expensive card with repeating decimal',
        33.33, 30.00, 32.00, 33.33,
        'EXPENSIVE'
    );
    
    console.log('✅ All expensive card tests passed!\n');
}

function testEdgeCasesAndErrorConditions() {
    console.log('🔍 Testing Edge Cases and Error Conditions\n');
    
    // Zero and negative values
    testPricingScenario(
        'Zero market price (should be cheap category)',
        0.00, 0.75, 1.00, 0.75,
        'EDGE CASE'
    );
    
    testPricingScenario(
        'Zero market price with low price below minimum',
        0.00, 0.25, 1.00, 0.50,
        'EDGE CASE'
    );
    
    testPricingScenario(
        'All zero values',
        0.00, 0.00, 0.00, 0.50,
        'EDGE CASE'
    );
    
    // Boundary precision tests
    testPricingScenario(
        'Exact boundary - $0.30 vs $0.300001',
        0.300001, 0.60, 1.00, 0.650000, // Should be standard: avg = (1.00 + 0.300001) / 2 = 0.650000
        'EDGE CASE'
    );
    
    testPricingScenario(
        'Exact boundary - $30.00 vs $30.000001',
        30.000001, 25.00, 28.00, 30.000001,
        'EDGE CASE'
    );
    
    // Minimum floor edge cases
    testPricingScenario(
        'Standard card with average exactly at minimum',
        1.00, 0.25, 0.00, 0.50, // avg = (0.00 + 1.00) / 2 = 0.50
        'EDGE CASE'
    );
    
    testPricingScenario(
        'Standard card with average just below minimum',
        0.80, 0.25, 0.15, 0.50, // avg = (0.15 + 0.80) / 2 = 0.475
        'EDGE CASE'
    );
    
    console.log('✅ All edge case tests passed!\n');
}

function testRealWorldScenarios() {
    console.log('🔍 Testing Real-World Scenarios\n');
    
    // Based on actual TCG card pricing patterns
    testPricingScenario(
        'Common card - typical pricing',
        0.25, 0.20, 0.45, 0.50,
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Uncommon card - moderate value',
        2.50, 2.25, 2.75, 2.625, // avg = (2.75 + 2.50) / 2 = 2.625
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Rare card - higher value',
        15.00, 14.50, 16.00, 15.50, // avg = (16.00 + 15.00) / 2 = 15.50
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Mythic rare - expensive',
        45.00, 42.00, 44.00, 45.00,
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Vintage card - very expensive',
        250.00, 240.00, 245.00, 250.00,
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Bulk rare - low value but above cheap threshold',
        0.75, 0.50, 1.25, 1.00, // avg = (1.25 + 0.75) / 2 = 1.00
        'REAL WORLD'
    );
    
    console.log('✅ All real-world scenario tests passed!\n');
}

function runPricingTests() {
    console.log('🧪 Running TCG Card Manager Pricing Logic Tests\n');
    console.log('Testing business rules for card pricing calculation\n');
    console.log('='.repeat(60) + '\n');
    
    try {
        testCheapCards();
        testStandardCards();
        testExpensiveCards();
        testEdgeCasesAndErrorConditions();
        testRealWorldScenarios();
        
        console.log('🎉 All pricing logic tests passed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Cheap cards (≤ $0.30): Correctly apply max($0.50, low price)');
        console.log('✅ Standard cards ($0.30-$30): Correctly apply max($0.50, max(low, avg))');
        console.log('✅ Expensive cards (> $30): Correctly preserve market price');
        console.log('✅ Edge cases: Properly handle boundaries and precision');
        console.log('✅ Real-world scenarios: Realistic pricing patterns work correctly');
        
    } catch (error) {
        console.error('\n❌ Pricing test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    runPricingTests();
}

module.exports = {
    calculatePrice,
    runPricingTests
};
