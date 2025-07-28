// Test the final fix for the triple quotes issue
console.log('Testing final fix for triple quotes issue...\n');

// Updated escapeCSV function
const escapeCSV = (value) => {
    // Treat null, undefined, empty, or whitespace-only values as nulls
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.trim() === '')) {
        return '';  // CSV null: leave the field blank
    }

    const str = String(value).trim();

    // Quote only if necessary
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
};

// Test various edge cases that might cause triple quotes
const testCases = [
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
    { name: 'empty string', value: '' },
    { name: 'whitespace only', value: '   ' },
    { name: 'string with quotes', value: 'Set "with quotes"' },
    { name: 'string with commas', value: 'Set, with commas' },
    { name: 'normal string', value: 'Normal Set' },
];

console.log('=== Testing individual values ===');
testCases.forEach(test => {
    const result = escapeCSV(test.value);
    console.log(`${test.name}: ${JSON.stringify(test.value)} -> "${result}"`);
});

// Test the problematic scenario
console.log('\n=== Testing problematic CSV row scenario ===');

const problematicCard = {
    tcgplayer_id: 12345,
    set_name: 'Set with "quotes"',  // This will be quoted
    name: 'Card Name',
    collector_number: '123',
    rarity: 'common',
    prices: { usd: '1.00' },
    image_uris: null  // No image URLs
};

const item = {
    quantity: 1,
    condition: 'Near Mint',
    price: 1.50
};

const row = [
    escapeCSV(problematicCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(problematicCard.set_name || ''),
    escapeCSV(problematicCard.name || ''),
    escapeCSV(''),  // Title - always empty
    escapeCSV(problematicCard.collector_number || ''),
    escapeCSV(problematicCard.rarity ? problematicCard.rarity.charAt(0).toUpperCase() : ''),
    escapeCSV(item.condition || 'Near Mint'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV('0'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV(item.quantity || '1'),
    escapeCSV('0'),
    escapeCSV(item.price?.toFixed(2) || '0'),
    escapeCSV(problematicCard.image_uris?.normal || problematicCard.image_uris?.large || '')  // Photo URL
];

const csvRow = row.join(',');
console.log(`CSV Row: ${csvRow}`);

// Check for triple quotes pattern
if (csvRow.includes('""",')) {
    console.log('\n❌ STILL FOUND TRIPLE QUOTES PATTERN!');
    
    let pos = 0;
    while ((pos = csvRow.indexOf('""",', pos)) !== -1) {
        const before = csvRow.substring(Math.max(0, pos - 15), pos);
        const after = csvRow.substring(pos, pos + 15);
        console.log(`Position ${pos}: ...${before}[""",]${after.substring(4)}...`);
        pos += 4;
    }
} else {
    console.log('\n✅ SUCCESS! No triple quotes pattern found!');
}

// Test with multiple empty fields in a row
console.log('\n=== Testing multiple consecutive empty fields ===');
const testRow = [
    escapeCSV('Normal Field'),
    escapeCSV('Field with "quotes"'),
    escapeCSV(''),  // Empty
    escapeCSV(''),  // Empty
    escapeCSV(''),  // Empty
    escapeCSV('Another Normal Field')
];

const testCsv = testRow.join(',');
console.log(`Test CSV: ${testCsv}`);

if (testCsv.includes('""",')) {
    console.log('❌ Found triple quotes in consecutive empty fields test');
} else {
    console.log('✅ No triple quotes in consecutive empty fields test');
}
