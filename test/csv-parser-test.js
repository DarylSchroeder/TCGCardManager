// Test proper CSV parsing with embedded commas
const fs = require('fs');

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
    result.push(current); // Add the last field
    return result;
}

// Test with the problematic line
const csv = fs.readFileSync('/root/code/tcg_card_manager/tmp/updated_inventory_2025-11-05 (2).csv', 'utf8');
const lines = csv.trim().split('\n');
const line20 = lines[20];

console.log('🔧 Testing proper CSV parsing:');
console.log('Raw line:', line20.substring(0, 100) + '...');

const properParsed = parseCSVLine(line20);
console.log('\n✅ Properly parsed columns:');
properParsed.forEach((col, i) => {
    if (i >= 3 && i <= 15) {
        console.log(`  ${i}: '${col}'`);
    }
});

console.log('\n📊 Key values:');
console.log(`Product Name: '${properParsed[3]}'`);
console.log(`Market Price: '${properParsed[8]}'`);
console.log(`Low Price: '${properParsed[11]}'`);
console.log(`Calculated: '${properParsed[14]}'`);
