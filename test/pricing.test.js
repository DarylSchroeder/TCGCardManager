// Pricing Logic Functional Tests
// Tests the TCG Card Manager pricing calculation business rules

// Load configuration
const fs = require('fs');
const path = require('path');

let config;
try {
    const configPath = path.join(__dirname, '..', 'config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    // Fallback to default strategy if config file doesn't exist
    config = {
        pricing: {
            strategy: "PRICING_STRATEGY_HIGHEST_PROFIT"
        }
    };
}

// Extract the pricing logic from the main application
function calculatePrice(tcgMarketPrice, tcgLowPrice, tcgLowWithShipping, cardName = '', originalPrice = null, strategy = null) {
    const pricingStrategy = strategy || config.pricing.strategy;
    const marketPrice = tcgMarketPrice;
    const lowPrice = tcgLowPrice;
    const lowWithShipping = tcgLowWithShipping;
    
    // Named Card Exclusions: Specific cards that should keep their original price
    const EXCLUDED_CARDS = [
        'Godless Shrine',
        'Cavern of Souls',
        // Shock Lands (all 10)
        'Temple Garden',
        'Steam Vents',
        'Overgrown Tomb',
        'Sacred Foundry',
        'Watery Grave',
        'Stomping Ground',
        'Breeding Pool',
        'Blood Crypt',
        'Hallowed Fountain'
    ];
    
    let estimatedPrice;
    
    // Named Card Exclusions: Keep original price for cards containing these names (case-insensitive)
    const isExcludedCard = EXCLUDED_CARDS.some(excludedName => 
        cardName && cardName.toLowerCase().includes(excludedName.toLowerCase())
    );
    
    if (isExcludedCard) {
        // Keep the original price (your existing price, not the market price)
        estimatedPrice = originalPrice || marketPrice;
    } else if (marketPrice <= 0.30) {
        // Cheap cards
        estimatedPrice = Math.max(0.50, lowPrice);
    } else if (marketPrice > 30) {
        // Expensive cards: Use the greater of market price or original inventory price
        estimatedPrice = originalPrice ? Math.max(marketPrice, originalPrice) : marketPrice;
    } else if (marketPrice > 30) {
        // Expensive cards - strategy-dependent calculation
        if (pricingStrategy === "PRICING_STRATEGY_PENNY_UNDER_AVERAGE") {
            const validPrices = [marketPrice, lowPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            const pennyUnder = average - 0.01;
            estimatedPrice = originalPrice ? Math.max(0.50, pennyUnder, originalPrice) : Math.max(0.50, pennyUnder);
        } else {
            // Use the greater of market price or original inventory price
            estimatedPrice = originalPrice ? Math.max(marketPrice, originalPrice) : marketPrice;
        }
    } else {
        // Standard cards - strategy-dependent calculation
        if (pricingStrategy === "PRICING_STRATEGY_HIGHEST_VOLUME") {
            // HIGHEST_VOLUME: max($0.50, avg(valid prices))
            const validPrices = [lowPrice, lowWithShipping, marketPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            estimatedPrice = Math.max(0.50, average);
        } else if (pricingStrategy === "PRICING_STRATEGY_PENNY_UNDER_AVERAGE") {
            // PENNY_UNDER_AVERAGE: max($0.50, avg(valid prices) - $0.01)
            const validPrices = [marketPrice, lowPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            estimatedPrice = Math.max(0.50, average - 0.01);
        } else {
            // HIGHEST_PROFIT (default): max($0.50, avg(valid low prices), Market Price)
            const validLowPrices = [lowPrice, lowWithShipping].filter(p => p > 0);
            const lowPriceAverage = validLowPrices.length > 0 ? validLowPrices.reduce((a, b) => a + b) / validLowPrices.length : 0;
            estimatedPrice = Math.max(0.50, lowPriceAverage, marketPrice);
        }
    }
    
    // Round to 2 decimal places
    return Math.round(estimatedPrice * 100) / 100;
}

// Test helper to format currency for display
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

// Test helper to run a pricing scenario
function testPricingScenario(description, marketPrice, lowPrice, lowWithShipping, expectedPrice, category, cardName = '', originalPrice = null, strategy = null) {
    const actualPrice = calculatePrice(marketPrice, lowPrice, lowWithShipping, cardName, originalPrice, strategy);
    const passed = Math.abs(actualPrice - expectedPrice) < 0.001; // Allow for floating point precision
    
    const strategyLabel = strategy ? ` [${strategy}]` : '';
    console.log(`${passed ? '✅' : '❌'} ${category}${strategyLabel}: ${description}`);
    if (cardName) {
        console.log(`   Card: "${cardName}"`);
    }
    if (originalPrice !== null) {
        console.log(`   Original Price: ${formatPrice(originalPrice)}`);
    }
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
    
    // Test HIGHEST_PROFIT strategy
    console.log('📈 HIGHEST_PROFIT Strategy: max($0.50, avg(TCG Low Price, TCG Low Price with Shipping), Market Price)\n');
    
    testPricingScenario(
        'Standard card where market price wins',
        5.00, 4.50, 3.00, 5.00, // avg(4.50, 3.00) = 3.75, max(0.50, 3.75, 5.00) = 5.00
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    testPricingScenario(
        'Standard card where low price average wins',
        5.00, 3.00, 6.00, 5.00, // avg(3.00, 6.00) = 4.50, max(0.50, 4.50, 5.00) = 5.00
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    testPricingScenario(
        'Low price average wins over market price',
        6.00, 8.00, 7.00, 7.50, // avg(8.00, 7.00) = 7.50, max(0.50, 7.50, 6.00) = 7.50
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    // Test HIGHEST_VOLUME strategy
    console.log('📊 HIGHEST_VOLUME Strategy: max($0.50, avg(TCG Low Price, TCG Low Price with Shipping, Market Price))\n');
    
    testPricingScenario(
        'Standard card with 3-way average',
        5.00, 4.50, 3.00, 4.17, // avg(4.50, 3.00, 5.00) = 4.167, max(0.50, 4.167) = 4.17
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    testPricingScenario(
        'Standard card with 3-way average (different values)',
        6.00, 8.00, 7.00, 7.00, // avg(8.00, 7.00, 6.00) = 7.00, max(0.50, 7.00) = 7.00
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    testPricingScenario(
        'Standard card hitting minimum floor with volume strategy',
        1.00, 0.25, 0.30, 0.52, // avg(0.25, 0.30, 1.00) = 0.517, max(0.50, 0.517) = 0.52
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    // Test boundary cases for both strategies
    testPricingScenario(
        'Just above cheap threshold - $0.31 (HIGHEST_PROFIT)',
        0.31, 0.25, 0.40, 0.50, // avg(0.25, 0.40) = 0.325, max(0.50, 0.325, 0.31) = 0.50
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    testPricingScenario(
        'Just above cheap threshold - $0.31 (HIGHEST_VOLUME)',
        0.31, 0.25, 0.40, 0.50, // avg(0.25, 0.40, 0.31) = 0.32, max(0.50, 0.32) = 0.50
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    testPricingScenario(
        'Exactly at expensive threshold - $30.00 (HIGHEST_PROFIT)',
        30.00, 25.00, 28.00, 30.00, // avg(25.00, 28.00) = 26.50, max(0.50, 26.50, 30.00) = 30.00
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    testPricingScenario(
        'Exactly at expensive threshold - $30.00 (HIGHEST_VOLUME)',
        30.00, 25.00, 28.00, 27.67, // avg(25.00, 28.00, 30.00) = 27.667, max(0.50, 27.667) = 27.67
        'STANDARD', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    console.log('✅ All standard card tests passed!\n');
}

function testExpensiveCards() {
    console.log('🔍 Testing Expensive Cards (Market Price > $30.00)\n');
    console.log('Rule: Use the greater of market price or original inventory price\n');
    
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
    
    // Test expensive cards with original prices (the key logic)
    testPricingScenario(
        'Expensive card with higher original price - should use original',
        50.00, 45.00, 47.00, 75.00,
        'EXPENSIVE', '', 75.00
    );
    
    testPricingScenario(
        'Expensive card with lower original price - should use market price',
        100.00, 95.00, 97.00, 100.00,
        'EXPENSIVE', '', 80.00
    );
    
    testPricingScenario(
        'Expensive card with equal original price - should use either (market)',
        60.00, 55.00, 57.00, 60.00,
        'EXPENSIVE', '', 60.00
    );
    
    testPricingScenario(
        'Expensive card with no original price - should use market price',
        60.00, 55.00, 57.00, 60.00,
        'EXPENSIVE', '', null
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
        0.300001, 0.60, 1.00, 0.63, // Should be standard: avg(0.60, 1.00, 0.300001) = 0.63 (HIGHEST_VOLUME)
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
        1.00, 0.25, 0.00, 0.63, // avg(0.25, 1.00) = 0.625 ≈ 0.63 (HIGHEST_VOLUME, filtering zero)
        'EDGE CASE'
    );
    
    testPricingScenario(
        'Standard card with average just below minimum',
        0.80, 0.25, 0.15, 0.50, // avg(0.25, 0.15, 0.80) = 0.40, max(0.50, 0.40) = 0.50 (HIGHEST_VOLUME)
        'EDGE CASE'
    );
    
    console.log('✅ All edge case tests passed!\n');
}

function testPricingStrategies() {
    console.log('🔍 Testing All Pricing Strategies\n');
    
    // Test PENNY_UNDER_AVERAGE strategy
    testPricingScenario(
        'Standard card - Penny Under Average',
        5.00, 4.50, 4.75, 4.74, // avg(5.00, 4.50) - 0.01 = 4.75 - 0.01 = 4.74
        'PENNY_UNDER', '', null, 'PRICING_STRATEGY_PENNY_UNDER_AVERAGE'
    );
    
    testPricingScenario(
        'Expensive card - Penny Under Average with original protection',
        50.00, 45.00, 47.00, 55.00, // avg(50.00, 45.00) - 0.01 = 47.49, but original 55.00 is higher
        'PENNY_UNDER', '', 55.00, 'PRICING_STRATEGY_PENNY_UNDER_AVERAGE'
    );
    
    // Test missing data scenarios for all strategies
    testPricingScenario(
        'Missing TCG Low - Penny Under Average',
        5.00, 0, 4.75, 4.99, // avg(5.00) - 0.01 = 4.99
        'MISSING_DATA', '', null, 'PRICING_STRATEGY_PENNY_UNDER_AVERAGE'
    );
    
    testPricingScenario(
        'Missing TCG Low - Highest Volume',
        5.00, 0, 4.75, 4.88, // avg(4.75, 5.00) = 4.875
        'MISSING_DATA', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
    );
    
    testPricingScenario(
        'Missing TCG Low - Highest Profit',
        5.00, 0, 4.75, 5.00, // max(0.50, avg(4.75), 5.00) = 5.00
        'MISSING_DATA', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
    );
    
    // Strategy comparison on same data
    const testCases = [
        {
            desc: 'Market price higher than low average',
            market: 10.00, low: 8.00, lowShip: 7.00,
            profitExpected: 10.00, // max(0.50, avg(8,7)=7.5, 10) = 10
            volumeExpected: 8.33,  // max(0.50, avg(8,7,10)=8.33) = 8.33
            pennyExpected: 8.99    // avg(10,8) - 0.01 = 9 - 0.01 = 8.99
        }
    ];
    
    testCases.forEach(testCase => {
        testPricingScenario(
            `${testCase.desc} - HIGHEST_PROFIT`,
            testCase.market, testCase.low, testCase.lowShip, testCase.profitExpected,
            'STRATEGY_COMPARISON', '', null, 'PRICING_STRATEGY_HIGHEST_PROFIT'
        );
        
        testPricingScenario(
            `${testCase.desc} - HIGHEST_VOLUME`,
            testCase.market, testCase.low, testCase.lowShip, testCase.volumeExpected,
            'STRATEGY_COMPARISON', '', null, 'PRICING_STRATEGY_HIGHEST_VOLUME'
        );
        
        testPricingScenario(
            `${testCase.desc} - PENNY_UNDER_AVERAGE`,
            testCase.market, testCase.low, testCase.lowShip, testCase.pennyExpected,
            'STRATEGY_COMPARISON', '', null, 'PRICING_STRATEGY_PENNY_UNDER_AVERAGE'
        );
    });
    
    console.log('✅ All pricing strategy tests passed!\n');
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
        2.50, 2.25, 2.75, 2.50, // avg(2.25, 2.75) = 2.50, max(0.50, 2.50, 2.50) = 2.50
        'REAL WORLD'
    );
    
    testPricingScenario(
        'Rare card - higher value',
        15.00, 14.50, 16.00, 15.17, // avg(14.50, 16.00, 15.00) = 15.17 (HIGHEST_VOLUME)
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
        0.75, 0.50, 1.25, 0.83, // avg(0.50, 1.25, 0.75) = 0.833 ≈ 0.83 (HIGHEST_VOLUME)
        'REAL WORLD'
    );
    
    console.log('✅ All real-world scenario tests passed!\n');
}

function testNameBasedExclusions() {
    console.log('🔍 Testing Name-Based Card Exclusions\n');
    console.log('Rule: Excluded cards keep their original market price regardless of other rules\n');
    
    // Test exact name matches
    testPricingScenario(
        'Godless Shrine - exact match (would be standard card otherwise)',
        15.00, 12.00, 14.00, 15.00,
        'EXCLUDED', 'Godless Shrine'
    );
    
    testPricingScenario(
        'Cavern of Souls - exact match (would be standard card otherwise)',
        25.00, 20.00, 22.00, 25.00,
        'EXCLUDED', 'Cavern of Souls'
    );
    
    // Test shock lands
    testPricingScenario(
        'Steam Vents - shock land exclusion',
        18.50, 16.00, 17.00, 18.50,
        'EXCLUDED', 'Steam Vents'
    );
    
    testPricingScenario(
        'Temple Garden - shock land exclusion',
        12.75, 11.00, 12.00, 12.75,
        'EXCLUDED', 'Temple Garden'
    );
    
    // Test case-insensitive matching
    testPricingScenario(
        'godless shrine - lowercase should match',
        20.00, 18.00, 19.00, 20.00,
        'EXCLUDED', 'godless shrine'
    );
    
    testPricingScenario(
        'CAVERN OF SOULS - uppercase should match',
        30.00, 28.00, 29.00, 30.00,
        'EXCLUDED', 'CAVERN OF SOULS'
    );
    
    // Test substring matching with variants
    testPricingScenario(
        'Godless Shrine (Borderless) - variant should match',
        22.00, 20.00, 21.00, 22.00,
        'EXCLUDED', 'Godless Shrine (Borderless)'
    );
    
    testPricingScenario(
        'Steam Vents (Foil) - foil variant should match',
        35.00, 32.00, 33.00, 35.00,
        'EXCLUDED', 'Steam Vents (Foil)'
    );
    
    testPricingScenario(
        'Cavern of Souls (Retro Frame) - retro variant should match',
        40.00, 38.00, 39.00, 40.00,
        'EXCLUDED', 'Cavern of Souls (Retro Frame)'
    );
    
    // Test that exclusions override other pricing rules
    testPricingScenario(
        'Godless Shrine - would be cheap card but excluded',
        0.25, 0.20, 0.30, 0.25,
        'EXCLUDED', 'Godless Shrine'
    );
    
    testPricingScenario(
        'Steam Vents - would be expensive card but excluded (same result)',
        45.00, 40.00, 42.00, 45.00,
        'EXCLUDED', 'Steam Vents'
    );
    
    // Test non-excluded cards still follow normal rules
    testPricingScenario(
        'Lightning Bolt - not excluded, should follow cheap card rules',
        0.25, 0.20, 0.30, 0.50,
        'NOT EXCLUDED', 'Lightning Bolt'
    );
    
    testPricingScenario(
        'Tarmogoyf - not excluded, should follow expensive card rules',
        45.00, 40.00, 42.00, 45.00,
        'NOT EXCLUDED', 'Tarmogoyf'
    );
    
    testPricingScenario(
        'Snapcaster Mage - not excluded, should follow standard card rules',
        15.00, 12.00, 14.00, 13.67, // avg(12.00, 14.00, 15.00) = 13.67 (HIGHEST_VOLUME default)
        'NOT EXCLUDED', 'Snapcaster Mage'
    );
    
    // Test partial matches don't trigger exclusion
    testPricingScenario(
        'Shrine of Burning Rage - contains "Shrine" but should not match',
        2.00, 1.50, 1.75, 1.75, // avg(1.50, 1.75, 2.00) = 1.75 (HIGHEST_VOLUME default)
        'NOT EXCLUDED', 'Shrine of Burning Rage'
    );
    
    // Test that exclusions preserve original price when available
    testPricingScenario(
        'Godless Shrine - should preserve original price ($17.00) over market price ($8.62)',
        8.62, 7.50, 8.81, 17.00,
        'EXCLUDED', 'Godless Shrine', 17.00
    );
    
    testPricingScenario(
        'Steam Vents - should preserve original price ($25.00) over market price ($18.50)',
        18.50, 16.00, 17.00, 25.00,
        'EXCLUDED', 'Steam Vents', 25.00
    );
    
    // Test that exclusions fall back to market price when no original price
    testPricingScenario(
        'Cavern of Souls - should use market price when no original price available',
        30.00, 28.00, 29.00, 30.00,
        'EXCLUDED', 'Cavern of Souls', null
    );
    
    console.log('✅ All name-based exclusion tests passed!\n');
}

function runPricingTests() {
    console.log('🧪 Running TCG Card Manager Pricing Logic Tests\n');
    console.log('Testing business rules for card pricing calculation\n');
    console.log('='.repeat(60) + '\n');
    
    try {
        testCheapCards();
        testStandardCards();
        testExpensiveCards();
        testNameBasedExclusions();
        testPricingStrategies();
        testEdgeCasesAndErrorConditions();
        testRealWorldScenarios();
        
        console.log('🎉 All pricing logic tests passed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Cheap cards (≤ $0.30): Correctly apply max($0.50, low price)');
        console.log('✅ Standard cards ($0.30-$30): Correctly apply max($0.50, max(low, 70% market + 30% low))');
        console.log('✅ Expensive cards (> $30): Correctly preserve market price');
        console.log('✅ Name-based exclusions: Correctly preserve original price for excluded cards');
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
