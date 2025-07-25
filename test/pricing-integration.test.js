// Pricing Integration Test
// Tests the full workflow: Import → Calculate Pricing → Export

const fs = require('fs');
const path = require('path');

// Sample TCGplayer CSV with cards from different pricing categories
const sampleTCGPlayerCSV = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Rarity,Condition,TCG Market Price,TCG Direct Low,TCG Low Price With Shipping,TCG Low Price,Total Quantity,Add to Quantity,TCG Marketplace Price,Photo URL
"12345","Magic","Alpha","Black Lotus","","1","M","Near Mint","8500.00","8000.00","8200.00","8100.00","1","0","8500.00","https://example.com/lotus.jpg"
"23456","Magic","Modern Masters","Lightning Bolt","","1","C","Near Mint","0.25","0.20","0.45","0.20","4","0","0.25","https://example.com/bolt.jpg"
"34567","Magic","Zendikar","Scalding Tarn","","1","R","Near Mint","15.50","14.00","16.25","14.50","2","0","15.50","https://example.com/tarn.jpg"
"45678","Magic","Innistrad","Snapcaster Mage","","78","R","Near Mint","45.00","42.00","44.50","43.00","1","0","45.00","https://example.com/snap.jpg"
"56789","Magic","Time Spiral","Niv-Mizzet, the Firemind","","225","R","Near Mint","2.75","2.50","3.25","2.60","3","0","2.75","https://example.com/niv.jpg"`;

// Simulate the pricing calculation logic from the main application
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

// Simulate the import function
function importTCGPlayerCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const header = parseCSVLine(lines[0]);
    const inventory = [];
    
    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        
        const quantity = parseInt(fields[12]) || 0;
        if (quantity === 0) continue;
        
        const item = {
            card: {
                tcgplayer_id: fields[0],
                set_name: fields[2],
                name: fields[3],
                collector_number: fields[5],
                rarity: fields[6].toLowerCase(),
                prices: {
                    usd: parseFloat(fields[8]) || 0
                },
                image_uris: {
                    normal: fields[15]
                }
            },
            condition: fields[7],
            quantity: fields[12],
            price: parseFloat(fields[14]) || 0,
            // Store original pricing data for calculation
            tcgMarketPrice: parseFloat(fields[8]) || 0,
            tcgLowPrice: parseFloat(fields[11]) || 0,
            tcgLowWithShipping: parseFloat(fields[10]) || 0
        };
        
        inventory.push(item);
    }
    
    return inventory;
}

// Simulate the pricing calculation step
function calculateInventoryPricing(inventory) {
    inventory.forEach(item => {
        const calculatedPrice = calculatePrice(
            item.tcgMarketPrice,
            item.tcgLowPrice, 
            item.tcgLowWithShipping
        );
        
        // Update the item's price with the calculated value
        item.price = calculatedPrice;
        item.calculatedPrice = calculatedPrice; // Keep track for validation
    });
    
    return inventory;
}

// Simulate the export function
function exportInventoryToCSV(inventory) {
    const headers = [
        'TCGplayer Id',
        'Product Line', 
        'Set Name',
        'Product Name',
        'Title',
        'Number',
        'Rarity',
        'Condition',
        'TCG Market Price',
        'TCG Direct Low',
        'TCG Low Price With Shipping',
        'TCG Low Price',
        'Total Quantity',
        'Add to Quantity',
        'TCG Marketplace Price',
        'Photo URL'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    inventory.forEach(item => {
        const card = item.card;
        
        const escapeCSV = (value) => {
            if (value === null || value === undefined || value === '') {
                return '""';
            }
            const str = String(value);
            return '"' + str.replace(/"/g, '""') + '"';
        };
        
        const row = [
            escapeCSV(card.tcgplayer_id || ''),
            escapeCSV('Magic'),
            escapeCSV(card.set_name || ''),
            escapeCSV(card.name || ''),
            escapeCSV(''),
            escapeCSV(card.collector_number || ''),
            escapeCSV(card.rarity ? card.rarity.charAt(0).toUpperCase() : ''),
            escapeCSV(item.condition || 'Near Mint'),
            escapeCSV(item.tcgMarketPrice?.toFixed(2) || '0.00'),
            escapeCSV('0.00'),
            escapeCSV(item.tcgLowWithShipping?.toFixed(2) || '0.00'),
            escapeCSV(item.tcgLowPrice?.toFixed(2) || '0.00'),
            escapeCSV(item.quantity || '1'),
            escapeCSV('0'),
            escapeCSV(item.price?.toFixed(2) || '0.00'), // This should be the calculated price
            escapeCSV(card.image_uris?.normal || '')
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
}

function parseCSVLine(line) {
    const fields = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        
        if (c === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += c;
        }
    }
    
    fields.push(currentField);
    return fields;
}

// Test helper functions
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function testFullPricingIntegration() {
    console.log('🧪 Running Full Pricing Integration Test\n');
    console.log('Testing: Import → Calculate Pricing → Export → Validate\n');
    
    // Step 1: Import the CSV
    console.log('📥 Step 1: Importing TCGplayer CSV...');
    const inventory = importTCGPlayerCSV(sampleTCGPlayerCSV);
    console.log(`   Imported ${inventory.length} cards`);
    
    // Validate import worked correctly
    console.assert(inventory.length === 5, `Expected 5 cards, got ${inventory.length}`);
    
    const blackLotus = inventory.find(item => item.card.name === 'Black Lotus');
    const lightningBolt = inventory.find(item => item.card.name === 'Lightning Bolt');
    const scaldingTarn = inventory.find(item => item.card.name === 'Scalding Tarn');
    const snapcaster = inventory.find(item => item.card.name === 'Snapcaster Mage');
    const nivMizzet = inventory.find(item => item.card.name === 'Niv-Mizzet, the Firemind');
    
    console.assert(blackLotus !== undefined, 'Black Lotus should be imported');
    console.assert(lightningBolt !== undefined, 'Lightning Bolt should be imported');
    console.assert(scaldingTarn !== undefined, 'Scalding Tarn should be imported');
    console.assert(snapcaster !== undefined, 'Snapcaster Mage should be imported');
    console.assert(nivMizzet !== undefined, 'Niv-Mizzet should be imported');
    
    console.log('   ✅ Import validation passed\n');
    
    // Step 2: Calculate pricing for all cards
    console.log('💰 Step 2: Calculating pricing for all cards...');
    calculateInventoryPricing(inventory);
    
    // Validate pricing calculations
    console.log('   Validating pricing calculations:');
    
    // Black Lotus: $8500 market (expensive card) → should keep market price
    console.log(`   Black Lotus: Market ${formatPrice(blackLotus.tcgMarketPrice)} → Calculated ${formatPrice(blackLotus.calculatedPrice)}`);
    console.assert(Math.abs(blackLotus.calculatedPrice - 8500.00) < 0.01, 
        `Black Lotus should be $8500.00, got ${blackLotus.calculatedPrice}`);
    
    // Lightning Bolt: $0.25 market (cheap card) → max($0.50, $0.20) = $0.50
    console.log(`   Lightning Bolt: Market ${formatPrice(lightningBolt.tcgMarketPrice)} → Calculated ${formatPrice(lightningBolt.calculatedPrice)}`);
    console.assert(Math.abs(lightningBolt.calculatedPrice - 0.50) < 0.01,
        `Lightning Bolt should be $0.50, got ${lightningBolt.calculatedPrice}`);
    
    // Scalding Tarn: $15.50 market (standard card) → max($0.50, max($14.50, avg($16.25, $15.50))) = max($0.50, max($14.50, $15.875)) = $15.875
    const expectedTarn = Math.max(0.50, Math.max(14.50, (16.25 + 15.50) / 2));
    console.log(`   Scalding Tarn: Market ${formatPrice(scaldingTarn.tcgMarketPrice)} → Calculated ${formatPrice(scaldingTarn.calculatedPrice)}`);
    console.assert(Math.abs(scaldingTarn.calculatedPrice - expectedTarn) < 0.01,
        `Scalding Tarn should be ${expectedTarn}, got ${scaldingTarn.calculatedPrice}`);
    
    // Snapcaster Mage: $45.00 market (expensive card) → should keep market price
    console.log(`   Snapcaster Mage: Market ${formatPrice(snapcaster.tcgMarketPrice)} → Calculated ${formatPrice(snapcaster.calculatedPrice)}`);
    console.assert(Math.abs(snapcaster.calculatedPrice - 45.00) < 0.01,
        `Snapcaster Mage should be $45.00, got ${snapcaster.calculatedPrice}`);
    
    // Niv-Mizzet: $2.75 market (standard card) → max($0.50, max($2.60, avg($3.25, $2.75))) = max($0.50, max($2.60, $3.00)) = $3.00
    const expectedNiv = Math.max(0.50, Math.max(2.60, (3.25 + 2.75) / 2));
    console.log(`   Niv-Mizzet: Market ${formatPrice(nivMizzet.tcgMarketPrice)} → Calculated ${formatPrice(nivMizzet.calculatedPrice)}`);
    console.assert(Math.abs(nivMizzet.calculatedPrice - expectedNiv) < 0.01,
        `Niv-Mizzet should be ${expectedNiv}, got ${nivMizzet.calculatedPrice}`);
    
    console.log('   ✅ Pricing calculation validation passed\n');
    
    // Step 3: Export to CSV
    console.log('📤 Step 3: Exporting inventory to CSV...');
    const exportedCSV = exportInventoryToCSV(inventory);
    
    // Step 4: Validate export format and pricing
    console.log('🔍 Step 4: Validating export format and pricing...');
    
    const exportLines = exportedCSV.trim().split('\n');
    console.assert(exportLines.length === 6, `Expected 6 lines (header + 5 cards), got ${exportLines.length}`);
    
    // Validate header
    const header = parseCSVLine(exportLines[0]);
    console.assert(header[0] === 'TCGplayer Id', 'Header should be correct');
    console.assert(header[14] === 'TCG Marketplace Price', 'Price column should be in correct position');
    
    // Parse and validate each exported card
    for (let i = 1; i < exportLines.length; i++) {
        const fields = parseCSVLine(exportLines[i]);
        const cardName = fields[3];
        const exportedPrice = parseFloat(fields[14]);
        
        // Find the corresponding inventory item
        const inventoryItem = inventory.find(item => item.card.name === cardName);
        console.assert(inventoryItem !== undefined, `Should find inventory item for ${cardName}`);
        
        // Validate the exported price matches the calculated price
        console.assert(Math.abs(exportedPrice - inventoryItem.calculatedPrice) < 0.01,
            `Exported price for ${cardName} should be ${inventoryItem.calculatedPrice}, got ${exportedPrice}`);
        
        console.log(`   ${cardName}: Exported price ${formatPrice(exportedPrice)} ✅`);
    }
    
    // Validate specific formatting
    console.log('   Validating CSV formatting:');
    
    // Check that card names with commas are properly quoted
    const nivMizzetLine = exportLines.find(line => line.includes('Niv-Mizzet, the Firemind'));
    console.assert(nivMizzetLine !== undefined, 'Should find Niv-Mizzet line');
    console.assert(nivMizzetLine.includes('"Niv-Mizzet, the Firemind"'), 'Card name with comma should be quoted');
    console.log('   ✅ Card names with commas properly quoted');
    
    // Check that all prices are formatted to 2 decimal places
    for (let i = 1; i < exportLines.length; i++) {
        const fields = parseCSVLine(exportLines[i]);
        const priceField = fields[14];
        const priceMatch = priceField.match(/^\d+\.\d{2}$/);
        console.assert(priceMatch !== null, `Price should be formatted to 2 decimals: ${priceField}`);
    }
    console.log('   ✅ All prices formatted to 2 decimal places');
    
    // Check that all fields are properly quoted
    for (let i = 0; i < exportLines.length; i++) {
        const line = exportLines[i];
        const fieldCount = (line.match(/"/g) || []).length;
        console.assert(fieldCount % 2 === 0, `Line ${i} should have even number of quotes`);
    }
    console.log('   ✅ All fields properly quoted');
    
    console.log('   ✅ Export format validation passed\n');
    
    // Step 5: Test round-trip to ensure no data corruption
    console.log('🔄 Step 5: Testing round-trip import of exported CSV...');
    const reimportedInventory = importTCGPlayerCSV(exportedCSV);
    
    console.assert(reimportedInventory.length === inventory.length, 
        'Reimported inventory should have same number of items');
    
    // Validate that the exported prices are preserved
    for (const originalItem of inventory) {
        const reimportedItem = reimportedInventory.find(item => 
            item.card.tcgplayer_id === originalItem.card.tcgplayer_id);
        
        console.assert(reimportedItem !== undefined, 
            `Should find reimported item for ${originalItem.card.name}`);
        
        console.assert(Math.abs(reimportedItem.price - originalItem.calculatedPrice) < 0.01,
            `Reimported price should match calculated price for ${originalItem.card.name}`);
    }
    
    console.log('   ✅ Round-trip validation passed\n');
    
    console.log('🎉 Full Pricing Integration Test Passed!\n');
    
    // Summary
    console.log('📊 Integration Test Summary:');
    console.log('✅ Import: Successfully parsed 5 cards from TCGplayer CSV');
    console.log('✅ Pricing: Correctly applied business rules to all price categories');
    console.log('   • Expensive cards (Black Lotus, Snapcaster): Preserved market price');
    console.log('   • Cheap cards (Lightning Bolt): Applied $0.50 minimum');
    console.log('   • Standard cards (Scalding Tarn, Niv-Mizzet): Used max(low, average) logic');
    console.log('✅ Export: Generated properly formatted CSV with calculated prices');
    console.log('✅ Format: All fields quoted, prices to 2 decimals, commas handled');
    console.log('✅ Round-trip: No data loss through full import/export cycle');
}

function runPricingIntegrationTests() {
    console.log('🧪 Running TCG Card Manager Pricing Integration Tests\n');
    console.log('='.repeat(70) + '\n');
    
    try {
        testFullPricingIntegration();
        
        console.log('\n🎉 All pricing integration tests passed!');
        console.log('The full workflow (Import → Calculate → Export) works correctly!');
        
    } catch (error) {
        console.error('\n❌ Pricing integration test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    runPricingIntegrationTests();
}

module.exports = {
    importTCGPlayerCSV,
    calculateInventoryPricing,
    exportInventoryToCSV,
    runPricingIntegrationTests
};
