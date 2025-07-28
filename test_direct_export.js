// Direct test of CSV export functionality by simulating the browser environment
const https = require('https');
const fs = require('fs');

// Mock card data that might cause issues
const mockInventory = [
    {
        id: 1,
        card: {
            name: 'Lightning Bolt',
            set_name: 'Magic 2011',
            tcgplayer_id: 12345,
            collector_number: '123',
            rarity: 'common',
            prices: { usd: '0.50' },
            image_uris: { normal: 'https://example.com/image1.jpg' }
        },
        quantity: 2,
        condition: 'Near Mint',
        price: 1.50,
        total: 3.00
    },
    {
        id: 2,
        card: {
            name: 'Counterspell',
            set_name: 'Ice Age',
            tcgplayer_id: null,  // This should be empty
            collector_number: '',  // Empty string
            rarity: 'uncommon',
            prices: { usd: null },  // Null price
            image_uris: { normal: '' }  // Empty image URL
        },
        quantity: 1,
        condition: 'Lightly Played',
        price: 0,  // Zero price
        total: 0
    },
    {
        id: 3,
        card: {
            name: 'Card with, Comma',
            set_name: 'Set "with quotes"',
            tcgplayer_id: 67890,
            collector_number: ' ',  // Single space - should be problematic
            rarity: '  ',  // Multiple spaces - should be problematic
            prices: { usd: '  5.00  ' },  // Price with spaces
            image_uris: { normal: 'https://example.com/image3.jpg' }
        },
        quantity: 3,
        condition: 'Moderately Played',
        price: 4.99,
        total: 14.97
    }
];

// Copy the exact escapeCSV function from index.html
function escapeCSV(value) {
    console.log(`escapeCSV input: ${JSON.stringify(value)} (type: ${typeof value})`);
    
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        console.log('  -> Returning empty string');
        return '';
    }
    
    const str = String(value).trim();  // Trim whitespace from all values
    console.log(`  -> Trimmed string: "${str}"`);
    
    // Only quote if the string contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        const result = '"' + str.replace(/"/g, '""') + '"';
        console.log(`  -> Needs quoting: ${result}`);
        return result;
    }
    
    console.log(`  -> No quoting needed: ${str}`);
    return str;
}

function testDirectExport() {
    console.log('Testing direct CSV export with mock data...\n');
    
    // Create CSV content with TCGplayer format (copied from index.html)
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
    console.log('Headers:', headers.join(','));
    console.log('\nProcessing inventory items:\n');
    
    mockInventory.forEach((item, index) => {
        console.log(`=== Processing Item ${index + 1}: ${item.card.name} ===`);
        const card = item.card;
        
        const row = [
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
        ];
        
        const csvRow = row.join(',');
        console.log(`Final row: ${csvRow}\n`);
        csvContent += csvRow + '\n';
    });
    
    console.log('=== FINAL CSV CONTENT ===');
    console.log(csvContent);
    console.log('=== END CSV CONTENT ===\n');
    
    // Save to file for inspection
    fs.writeFileSync('direct_export_test.csv', csvContent);
    console.log('CSV saved to: direct_export_test.csv');
    
    // Analyze for issues
    console.log('\nAnalyzing for issues:');
    const lines = csvContent.split('\n');
    
    lines.forEach((line, index) => {
        if (line.trim() === '') return;
        
        console.log(`Line ${index + 1}: ${line}`);
        
        // Check for triple quotes pattern
        if (line.includes('""",')) {
            console.log(`  ⚠️  FOUND TRIPLE QUOTES PATTERN: """,`);
        }
        
        // Check for quoted empty fields
        if (line.includes('""')) {
            console.log(`  ⚠️  FOUND QUOTED EMPTY FIELD: ""`);
        }
        
        // Check for consecutive commas (proper empty fields)
        const emptyFieldMatches = line.match(/,,+/g);
        if (emptyFieldMatches) {
            emptyFieldMatches.forEach(match => {
                console.log(`  ✓ Found ${match.length - 1} consecutive empty fields: ${match}`);
            });
        }
    });
}

testDirectExport();
