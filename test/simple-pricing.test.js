// Simple pricing validation for CSV files
const fs = require('fs');
const { calculateTCGPrice } = require('../js/pricing');

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

function calculatePrice(tcgMarketPrice, tcgLowPrice, tcgLowWithShipping, cardName = '', originalPrice = 0) {
    return calculateTCGPrice({
        name: cardName,
        marketPrice: tcgMarketPrice,
        lowPrice: tcgLowPrice,
        lowShipping: tcgLowWithShipping,
        originalPrice
    });
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
    validateCSV(filePath);
}

module.exports = { validateCSV, calculatePrice };
