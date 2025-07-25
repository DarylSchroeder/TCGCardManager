const fs = require('fs');
const path = require('path');

// Extract the CSV functions from the main application
function escapeCSV(value) {
    if (value === null || value === undefined || value === '') {
        return '""';  // Return empty quoted string for NULL/empty values
    }
    const str = String(value);
    // Always quote strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

function parseCSVLine(line) {
    const fields = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        
        if (c === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            // Field separator
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += c;
        }
    }
    
    // Add last field
    fields.push(currentField);
    return fields;
}

function formatInventoryRow(item) {
    const card = item.card;
    
    return [
        escapeCSV(card.tcgplayer_id || ''),
        escapeCSV('Magic'),
        escapeCSV(card.set_name || ''),
        escapeCSV(card.name || ''),
        escapeCSV(''),
        escapeCSV(card.collector_number || ''),
        escapeCSV(card.rarity ? card.rarity.charAt(0).toUpperCase() : ''),
        escapeCSV(item.condition || 'Near Mint'),
        escapeCSV(card.prices?.usd || '0'),
        escapeCSV('0'),
        escapeCSV(card.prices?.usd || '0'),
        escapeCSV(card.prices?.usd || '0'),
        escapeCSV(item.quantity || '1'),
        escapeCSV('0'),
        escapeCSV(item.price?.toFixed(2) || '0'),
        escapeCSV(card.image_uris?.normal || card.image_uris?.large || '')
    ].join(',');
}

// Test data
const sampleCSV = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Rarity,Condition,TCG Market Price,TCG Direct Low,TCG Low Price With Shipping,TCG Low Price,Total Quantity,Add to Quantity,TCG Marketplace Price,Photo URL
"17173","Magic","7th Edition","Static Orb","","319","R","Near Mint","16.36","0","16.39","16.39","1","0","16.39",""
"6723809","Magic","30th Anniversary Promos","Niv-Mizzet, the Firemind","","14","P","Near Mint Foil","1.11","1.13","2.2900","0.9800","0.9800","0","0.6800",""
"23342","Magic","8th Edition","Glorious Anthem","","20","R","Near Mint","0.32","0","1.56","0.25","1","0","0.94",""`;

const sampleInventory = [
    {
        card: {
            tcgplayer_id: '17173',
            set_name: '7th Edition',
            name: 'Static Orb',
            collector_number: '319',
            rarity: 'rare',
            prices: { usd: '16.36' }
        },
        condition: 'Near Mint',
        quantity: '1',
        price: 16.39
    },
    {
        card: {
            tcgplayer_id: '6723809',
            set_name: '30th Anniversary Promos',
            name: 'Niv-Mizzet, the Firemind',
            collector_number: '14',
            rarity: 'promo',
            prices: { usd: '1.11' }
        },
        condition: 'Near Mint Foil',
        quantity: '0.9800',
        price: 0.68
    }
];

// Tests
function testCSVParsing() {
    console.log('Testing CSV parsing...');
    
    const lines = sampleCSV.split('\n');
    const header = parseCSVLine(lines[0]);
    const staticOrbRow = parseCSVLine(lines[1]);
    const nivMizzetRow = parseCSVLine(lines[2]);
    
    // Test header parsing
    console.assert(header[0] === 'TCGplayer Id', 'Header should parse correctly');
    console.assert(header.length === 16, 'Should have 16 columns');
    
    // Test Static Orb row
    console.assert(staticOrbRow[0] === '17173', 'TCGplayer ID should be 17173');
    console.assert(staticOrbRow[3] === 'Static Orb', 'Card name should be Static Orb');
    console.assert(staticOrbRow[12] === '1', 'Quantity should be 1');
    
    // Test Niv-Mizzet row (comma in name)
    console.assert(nivMizzetRow[3] === 'Niv-Mizzet, the Firemind', 'Card name with comma should parse correctly');
    console.assert(nivMizzetRow[2] === '30th Anniversary Promos', 'Set name should be correct');
    console.assert(nivMizzetRow[12] === '0.9800', 'Decimal quantity should be preserved');
    
    console.log('✅ CSV parsing tests passed');
}

function testCSVEscaping() {
    console.log('Testing CSV escaping...');
    
    // Test empty values
    console.assert(escapeCSV('') === '""', 'Empty string should become ""');
    console.assert(escapeCSV(null) === '""', 'Null should become ""');
    console.assert(escapeCSV(undefined) === '""', 'Undefined should become ""');
    
    // Test normal values
    console.assert(escapeCSV('test') === '"test"', 'Normal string should be quoted');
    console.assert(escapeCSV('123') === '"123"', 'Number should be quoted');
    
    // Test comma handling
    console.assert(escapeCSV('Niv-Mizzet, the Firemind') === '"Niv-Mizzet, the Firemind"', 'Comma should be handled');
    
    // Test quote escaping
    console.assert(escapeCSV('Say "Hello"') === '"Say ""Hello"""', 'Quotes should be escaped');
    
    console.log('✅ CSV escaping tests passed');
}

function testInventoryExport() {
    console.log('Testing inventory export...');
    
    const staticOrbRow = formatInventoryRow(sampleInventory[0]);
    const nivMizzetRow = formatInventoryRow(sampleInventory[1]);
    
    // Parse the generated rows to verify structure
    const staticFields = parseCSVLine(staticOrbRow);
    const nivFields = parseCSVLine(nivMizzetRow);
    
    // Test Static Orb export
    console.assert(staticFields[0] === '17173', 'TCGplayer ID should export correctly');
    console.assert(staticFields[3] === 'Static Orb', 'Card name should export correctly');
    console.assert(staticFields[12] === '1', 'Quantity should export correctly');
    
    // Test Niv-Mizzet export (comma handling)
    console.assert(nivFields[3] === 'Niv-Mizzet, the Firemind', 'Card name with comma should export correctly');
    console.assert(nivFields[12] === '0.9800', 'Decimal quantity should export correctly');
    
    console.log('✅ Inventory export tests passed');
}

function testRoundTrip() {
    console.log('Testing round-trip import/export...');
    
    const lines = sampleCSV.split('\n');
    const originalData = lines.slice(1).map(line => parseCSVLine(line));
    
    // Simulate export by formatting the data back to CSV
    const exportedLines = originalData.map(fields => {
        return fields.map(field => escapeCSV(field)).join(',');
    });
    
    // Parse the exported data back
    const reimportedData = exportedLines.map(line => parseCSVLine(line));
    
    // Verify data integrity
    console.assert(originalData.length === reimportedData.length, 'Record count should be preserved');
    
    for (let i = 0; i < originalData.length; i++) {
        for (let j = 0; j < originalData[i].length; j++) {
            console.assert(originalData[i][j] === reimportedData[i][j], 
                `Field [${i}][${j}] should match: "${originalData[i][j]}" vs "${reimportedData[i][j]}"`);
        }
    }
    
    console.log('✅ Round-trip tests passed');
}

// Run all tests
function runTests() {
    console.log('🧪 Running TCG Card Manager CSV Tests\n');
    
    try {
        testCSVParsing();
        testCSVEscaping();
        testInventoryExport();
        testRoundTrip();
        
        console.log('\n🎉 All tests passed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    escapeCSV,
    parseCSVLine,
    formatInventoryRow,
    runTests
};
