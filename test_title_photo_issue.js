// Test specifically for Title and Photo URL field issues
console.log('Testing Title and Photo URL field handling...\n');

// Current escapeCSV function from index.html
function escapeCSV(value) {
    console.log(`escapeCSV input: ${JSON.stringify(value)} (type: ${typeof value})`);
    
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        console.log('  -> Returning empty string');
        return '';
    }
    
    const str = String(value).trim();
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

// Test the exact scenarios from the CSV export
console.log('=== Testing Title Field (hardcoded empty string) ===');
const titleResult = escapeCSV('');
console.log(`Title result: "${titleResult}"\n`);

console.log('=== Testing Photo URL scenarios ===');

// Test various photo URL scenarios
const photoUrlScenarios = [
    '',  // Empty string
    null,  // Null
    undefined,  // Undefined
    'https://example.com/image.jpg',  // Normal URL
    'https://example.com/image,with,commas.jpg',  // URL with commas
    ' ',  // Single space
    '   ',  // Multiple spaces
];

photoUrlScenarios.forEach((url, index) => {
    console.log(`Photo URL scenario ${index + 1}:`);
    const result = escapeCSV(url);
    console.log(`Result: "${result}"\n`);
});

// Test the exact expression from the code
console.log('=== Testing exact Photo URL expression ===');
const mockCards = [
    {
        image_uris: { normal: 'https://example.com/normal.jpg' }
    },
    {
        image_uris: { large: 'https://example.com/large.jpg' }
    },
    {
        image_uris: { normal: '', large: 'https://example.com/large.jpg' }
    },
    {
        image_uris: { normal: null, large: null }
    },
    {
        image_uris: null
    },
    {}  // No image_uris property
];

mockCards.forEach((card, index) => {
    console.log(`Mock card ${index + 1}:`);
    const photoUrl = card.image_uris?.normal || card.image_uris?.large || '';
    console.log(`  Expression result: ${JSON.stringify(photoUrl)}`);
    const escaped = escapeCSV(photoUrl);
    console.log(`  Escaped result: "${escaped}"\n`);
});

// Test a complete CSV row with problematic Title and Photo URL
console.log('=== Testing complete CSV row ===');
const mockInventoryItem = {
    card: {
        tcgplayer_id: 12345,
        set_name: 'Test Set',
        name: 'Test Card',
        collector_number: '123',
        rarity: 'common',
        prices: { usd: '1.00' },
        image_uris: null  // This should cause empty Photo URL
    },
    quantity: 1,
    condition: 'Near Mint',
    price: 1.50
};

const card = mockInventoryItem.card;
const item = mockInventoryItem;

const row = [
    escapeCSV(card.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(card.set_name || ''),
    escapeCSV(card.name || ''),
    escapeCSV(''),  // Title - always empty
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
    escapeCSV(card.image_uris?.normal || card.image_uris?.large || '')  // Photo URL
];

console.log('Individual field results:');
row.forEach((field, index) => {
    const fieldNames = [
        'TCGplayer Id', 'Product Line', 'Set Name', 'Product Name', 'Title',
        'Number', 'Rarity', 'Condition', 'TCG Market Price', 'TCG Direct Low',
        'TCG Low Price With Shipping', 'TCG Low Price', 'Total Quantity',
        'Add to Quantity', 'TCG Marketplace Price', 'Photo URL'
    ];
    console.log(`  ${fieldNames[index]}: "${field}"`);
});

const csvRow = row.join(',');
console.log(`\nComplete CSV row: ${csvRow}`);

// Check for the specific pattern
if (csvRow.includes('""",')) {
    console.log('⚠️  FOUND TRIPLE QUOTES PATTERN in complete row!');
    const pos = csvRow.indexOf('""",');
    const before = csvRow.substring(Math.max(0, pos - 10), pos);
    const after = csvRow.substring(pos, pos + 10);
    console.log(`Context: ...${before}[""",]${after.substring(4)}...`);
} else {
    console.log('✓ No triple quotes pattern found in complete row');
}
