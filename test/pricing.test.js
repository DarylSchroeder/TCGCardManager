// Pricing Logic Functional Tests
const { calculatePrice: calculateWithStrategy, calculateTCGPrice, needsPricingReview, roundPrice } = require('../js/pricing');

function calculatePrice(tcgMarketPrice, tcgLowPrice, tcgLowWithShipping, cardName = '', originalPrice = 0) {
    return calculateTCGPrice({
        name: cardName,
        marketPrice: tcgMarketPrice,
        lowPrice: tcgLowPrice,
        lowShipping: tcgLowWithShipping,
        originalPrice
    });
}

function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function testPricingScenario(description, marketPrice, lowPrice, lowWithShipping, expectedPrice, category, cardName = '', originalPrice = 0) {
    const actualPrice = calculatePrice(marketPrice, lowPrice, lowWithShipping, cardName, originalPrice);
    const passed = Math.abs(actualPrice - expectedPrice) < 0.001;

    console.log(`${passed ? 'PASS' : 'FAIL'} ${category}: ${description}`);
    if (cardName) {
        console.log(`   Card: "${cardName}"`);
    }
    console.log(`   Market: ${formatPrice(marketPrice)}, Low: ${formatPrice(lowPrice)}, Low+Ship: ${formatPrice(lowWithShipping)}`);
    console.log(`   Original: ${formatPrice(originalPrice)}, Expected: ${formatPrice(expectedPrice)}, Actual: ${formatPrice(actualPrice)}`);

    if (!passed) {
        throw new Error(`Pricing test failed: ${description}`);
    }

    console.log('');
}

function testProtectedPrices() {
    console.log('Testing protected original prices\n');

    testPricingScenario(
        'Named exclusions preserve original inventory price',
        8.62, 8.00, 9.25, 17.00,
        'EXCLUSION', 'Godless Shrine', 17.00
    );

    testPricingScenario(
        'Shock lands preserve original inventory price',
        18.50, 16.00, 17.25, 25.00,
        'EXCLUSION', 'Steam Vents', 25.00
    );

    testPricingScenario(
        'Expensive cards preserve original inventory price when market is high',
        45.00, 28.00, 29.00, 40.00,
        'EXPENSIVE', 'Snapcaster Mage', 40.00
    );

    testPricingScenario(
        'Expensive cards preserve original inventory price when low price is high',
        25.00, 31.00, 32.00, 27.50,
        'EXPENSIVE', 'Premium Card', 27.50
    );
}

function testMinimumFloor() {
    console.log('Testing minimum price floor\n');

    testPricingScenario(
        'Cards with market and low below minimum use the floor',
        0.25, 0.30, 1.29, 0.50,
        'MINIMUM'
    );

    testPricingScenario(
        'Adjusted price cannot fall below minimum',
        1.00, 0.75, 1.00, 0.50,
        'MINIMUM'
    );
}

function testShippingAdvantageScale() {
    console.log('Testing sliding shipping advantage scale\n');

    testPricingScenario(
        'Low-end cards subtract $0.99 from low plus shipping',
        1.50, 1.25, 2.24, 1.25,
        'LOW_END'
    );

    testPricingScenario(
        'Mid-range cards subtract $0.50 from low plus shipping',
        5.00, 4.50, 5.49, 4.99,
        'MID_RANGE'
    );

    testPricingScenario(
        'Higher-end cards subtract $0.25 from low plus shipping',
        12.00, 11.00, 12.49, 12.00,
        'HIGHER_END'
    );
}

function testTrueMarketCap() {
    console.log('Testing true market cap\n');

    testPricingScenario(
        'Price is capped at market when adjusted low listing is higher',
        6.00, 5.00, 8.00, 6.00,
        'TRUE_MARKET'
    );

    testPricingScenario(
        'Low price can define true market when it exceeds market',
        3.00, 4.00, 4.99, 4.00,
        'TRUE_MARKET'
    );
}

function testUndercutLowStrategy() {
    console.log('Testing undercut-low strategy\n');

    const undercut = (marketPrice, lowPrice, lowShipping, cardName = '', originalPrice = 0) =>
        calculateWithStrategy({ name: cardName, marketPrice, lowPrice, lowShipping, originalPrice }, 'undercutLow');

    const scenarios = [
        ['Undercuts TCG Low by one cent', 8.62, 8.00, 9.25, 7.99],
        ['Honors the minimum floor', 0.75, 0.50, 0.60, 0.50],
        ['Retains protected-card guardrail', 18.50, 16.00, 17.25, 25.00, 'Steam Vents', 25.00],
        ['Retains high-value guardrail', 45.00, 28.00, 29.00, 40.00, 'Snapcaster Mage', 40.00]
    ];

    scenarios.forEach(([description, marketPrice, lowPrice, lowShipping, expected, cardName, originalPrice]) => {
        const actual = undercut(marketPrice, lowPrice, lowShipping, cardName, originalPrice);
        const passed = Math.abs(actual - expected) < 0.001;
        console.log(`${passed ? 'PASS' : 'FAIL'} UNDERCUT_LOW: ${description}`);
        if (!passed) throw new Error(`Pricing test failed: ${description}; expected ${expected}, got ${actual}`);
    });
    console.log('');
}

function testMarketAwareLowStrategy() {
    console.log('Testing market-aware low strategy\n');

    const marketAware = (marketPrice, lowPrice, lowShipping, cardName = '', originalPrice = 0) =>
        calculateWithStrategy({ name: cardName, marketPrice, lowPrice, lowShipping, originalPrice }, 'marketAwareLow');

    const scenarios = [
        ['Undercuts TCG Low when it is within fifty cents of market', 5.00, 4.60, 5.25, 4.59],
        ['Undercuts TCG Low when it is exactly fifty cents below market', 5.00, 4.50, 5.25, 4.49],
        ['Undercuts market when TCG Low is more than fifty cents below market', 5.00, 4.49, 5.25, 4.99],
        ['Honors the minimum floor', 0.75, 0.50, 0.60, 0.50],
        ['Retains protected-card guardrail', 18.50, 16.00, 17.25, 25.00, 'Steam Vents', 25.00],
        ['Retains high-value guardrail', 45.00, 28.00, 29.00, 40.00, 'Snapcaster Mage', 40.00]
    ];

    scenarios.forEach(([description, marketPrice, lowPrice, lowShipping, expected, cardName, originalPrice]) => {
        const actual = marketAware(marketPrice, lowPrice, lowShipping, cardName, originalPrice);
        const passed = Math.abs(actual - expected) < 0.001;
        console.log(`${passed ? 'PASS' : 'FAIL'} MARKET_AWARE_LOW: ${description}`);
        if (!passed) throw new Error(`Pricing test failed: ${description}; expected ${expected}, got ${actual}`);
    });
    console.log('');
}

function testPricingReviewFlags() {
    console.log('Testing pricing review flags\n');

    const missingLow = needsPricingReview({ marketPrice: 0.59, lowPrice: 0 });
    const validLow = needsPricingReview({ marketPrice: 0.59, lowPrice: 0.50 });
    const missingMarketWithValidLow = needsPricingReview({ marketPrice: 0, lowPrice: 0.59 });

    if (!missingLow || validLow || missingMarketWithValidLow) {
        throw new Error('Pricing review flag did not identify only a missing TCG Low with a valid market price');
    }

    console.log('PASS REVIEW: Missing TCG Low with a valid market price is flagged');
    console.log('');
}

function runAllTests() {
    console.log('TCG Card Manager Pricing Tests');
    console.log('================================\n');

    testProtectedPrices();
    testMinimumFloor();
    testShippingAdvantageScale();
    testTrueMarketCap();
    testUndercutLowStrategy();
    testMarketAwareLowStrategy();
    testPricingReviewFlags();

    console.log('All pricing tests passed.\n');
}

if (require.main === module) {
    runAllTests();
}

module.exports = {
    calculatePrice: calculateWithStrategy,
    calculateTCGPrice,
    roundPrice
};
