// Simple pricing validation for CSV files
const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Load config
let config;
try {
    config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
} catch (error) {
    config = { pricing: { strategy: "PRICING_STRATEGY_HIGHEST_PROFIT" } };
}

function calculatePrice(tcgMarketPrice, tcgLowPrice, tcgLowWithShipping, cardName = '', originalPrice = null, strategy = null) {
    const pricingStrategy = strategy || config.pricing.strategy;
    const marketPrice = tcgMarketPrice;
    const lowPrice = tcgLowPrice;
    const lowWithShipping = tcgLowWithShipping;
    
    const EXCLUDED_CARDS = [
        'Godless Shrine', 'Cavern of Souls', 'Temple Garden', 'Steam Vents', 'Overgrown Tomb',
        'Sacred Foundry', 'Watery Grave', 'Stomping Ground', 'Breeding Pool', 'Blood Crypt', 'Hallowed Fountain'
    ];
    
    let estimatedPrice;
    
    const isExcludedCard = EXCLUDED_CARDS.some(excludedName => 
        cardName && cardName.toLowerCase().includes(excludedName.toLowerCase())
    );
    
    if (isExcludedCard) {
        estimatedPrice = originalPrice || marketPrice;
    } else if (marketPrice <= 0.30) {
        estimatedPrice = Math.max(0.50, lowPrice);
    } else if (marketPrice > 30) {
        if (pricingStrategy === "PRICING_STRATEGY_PENNY_UNDER_AVERAGE") {
            const validPrices = [marketPrice, lowPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            const pennyUnder = average - 0.01;
            estimatedPrice = originalPrice ? Math.max(0.50, pennyUnder, originalPrice) : Math.max(0.50, pennyUnder);
        } else {
            estimatedPrice = originalPrice ? Math.max(marketPrice, originalPrice) : marketPrice;
        }
    } else {
        if (pricingStrategy === "PRICING_STRATEGY_HIGHEST_VOLUME") {
            const validPrices = [lowPrice, lowWithShipping, marketPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            estimatedPrice = Math.max(0.50, average);
        } else if (pricingStrategy === "PRICING_STRATEGY_PENNY_UNDER_AVERAGE") {
            const validPrices = [marketPrice, lowPrice].filter(p => p > 0);
            const average = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b) / validPrices.length : marketPrice;
            estimatedPrice = Math.max(0.50, average - 0.01);
        } else {
            const validLowPrices = [lowPrice, lowWithShipping].filter(p => p > 0);
            const lowPriceAverage = validLowPrices.length > 0 ? validLowPrices.reduce((a, b) => a + b) / validLowPrices.length : 0;
            estimatedPrice = Math.max(0.50, lowPriceAverage, marketPrice);
        }
    }
    
    return Math.round(estimatedPrice * 100) / 100;
}

function validateCSV(filePath) {
    console.log(`🔍 Validating: ${filePath}`);
    
    const csv = fs.readFileSync(filePath, 'utf8');
    const lines = csv.trim().split('\n');
    const header = lines[0];
    const data = lines.slice(1);
    
    console.log(`📊 Total rows: ${data.length}`);
    
    let errors = 0;
    let warnings = 0;
    let validated = 0;
    
    data.forEach((line, i) => {
        try {
            const cols = parseCSVLine(line);
            const cardName = cols[3] || '';
            const marketPrice = parseFloat(cols[8]) || 0;
            const lowPrice = parseFloat(cols[11]) || 0;
            const lowWithShipping = parseFloat(cols[10]) || 0;
            const actualPrice = parseFloat(cols[14]) || 0;
            
            const expectedPrice = calculatePrice(marketPrice, lowPrice, lowWithShipping, cardName);
            const diff = Math.abs(actualPrice - expectedPrice);
            
            if (diff > 0.01) {
                console.log(`❌ Row ${i+1}: ${cardName} - Expected: $${expectedPrice.toFixed(2)}, Actual: $${actualPrice.toFixed(2)}`);
                errors++;
            } else {
                validated++;
            }
            
            if (actualPrice < 0.50 && marketPrice > 0) {
                console.log(`⚠️  Row ${i+1}: ${cardName} - Price below minimum: $${actualPrice.toFixed(2)}`);
                warnings++;
            }
            
        } catch (e) {
            console.log(`💥 Row ${i+1}: Parse error - ${e.message}`);
            errors++;
        }
    });
    
    console.log(`\n📈 Validation Summary:`);
    console.log(`✅ Validated: ${validated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Success rate: ${((validated / data.length) * 100).toFixed(1)}%`);
    
    return errors === 0;
}

if (require.main === module) {
    const filePath = process.argv[2] || '/root/code/tcg_card_manager/tmp/updated_inventory_2025-11-05 (1).csv';
    const strategy = process.argv[3] || null;
    
    if (strategy) {
        console.log(`🔧 Using pricing strategy: ${strategy}`);
        config.pricing.strategy = strategy;
    }
    
    validateCSV(filePath);
}

module.exports = { validateCSV, calculatePrice };
