#!/usr/bin/env node

// Debug the empty field issue

function escapeCSV(value) {
    console.log(`escapeCSV called with: ${JSON.stringify(value)} (type: ${typeof value})`);
    
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        console.log('  -> Returning empty string');
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    console.log(`  -> Quoting non-empty value: "${str}"`);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

console.log('🔍 Testing escapeCSV with various empty values:\n');

const testValues = [
    null,
    undefined,
    '',
    '""',
    'null',
    'undefined'
];

testValues.forEach((value, index) => {
    console.log(`${index + 1}. Testing: ${JSON.stringify(value)}`);
    const result = escapeCSV(value);
    console.log(`   Result: ${JSON.stringify(result)}`);
    console.log(`   Length: ${result.length}\n`);
});

console.log('🧪 Testing a complete row with empty title field:\n');

// Simulate a card with empty title field
const mockCard = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: '001',
    rarity: 'common',
    prices: { usd: '1.50' }
};

const mockItem = {
    condition: 'Near Mint',
    quantity: '1',
    price: 1.50
};

console.log('Building CSV row...');
const row = [
    escapeCSV(mockCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(mockCard.set_name || ''),
    escapeCSV(mockCard.name || ''),
    escapeCSV(''),  // This is the title field - should be empty
    escapeCSV(mockCard.collector_number || ''),
    escapeCSV(mockCard.rarity ? mockCard.rarity.charAt(0).toUpperCase() : ''),
    escapeCSV(mockItem.condition || 'Near Mint'),
    escapeCSV(mockCard.prices?.usd || '0')
];

console.log('\nRow array:', row);
const csvLine = row.join(',');
console.log('\nGenerated CSV line:');
console.log(csvLine);

// Check for problematic patterns
if (csvLine.includes('""",')) {
    console.log('\n❌ Found problematic pattern: """,');
    
    // Find which field is causing it
    row.forEach((field, index) => {
        if (field === '""') {
            console.log(`   Field ${index} is generating ""`);
        }
    });
} else {
    console.log('\n✅ No problematic patterns found');
}

// Count commas to verify field count
const commaCount = (csvLine.match(/,/g) || []).length;
console.log(`\nComma count: ${commaCount} (should be ${row.length - 1})`);
console.log(`Field count: ${row.length}`);
