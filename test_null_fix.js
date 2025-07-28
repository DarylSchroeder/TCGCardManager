// Test the null fix for Title and Photo URL fields
console.log('Testing null fix for Title and Photo URL fields...\n');

const escapeCSV = (value) => {
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        return '';
    }
    const str = String(value).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

// Test the problematic scenario with the fix
const problematicCard = {
    tcgplayer_id: 12345,
    set_name: 'Set with "quotes"',  // This will be quoted and cause the pattern
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

console.log('=== Testing with NULL instead of empty strings ===');

const row = [
    escapeCSV(problematicCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(problematicCard.set_name || ''),
    escapeCSV(problematicCard.name || ''),
    escapeCSV(null),  // Title - now null instead of ''
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
    escapeCSV(problematicCard.image_uris?.normal || problematicCard.image_uris?.large || null)  // Photo URL - now null
];

console.log('Field by field results:');
const fieldNames = [
    'TCGplayer Id', 'Product Line', 'Set Name', 'Product Name', 'Title',
    'Number', 'Rarity', 'Condition', 'TCG Market Price', 'TCG Direct Low',
    'TCG Low Price With Shipping', 'TCG Low Price', 'Total Quantity',
    'Add to Quantity', 'TCG Marketplace Price', 'Photo URL'
];

row.forEach((field, index) => {
    console.log(`${fieldNames[index]}: "${field}"`);
});

const csvRow = row.join(',');
console.log(`\nComplete CSV row:`);
console.log(csvRow);

// Check for the problematic pattern
if (csvRow.includes('""",')) {
    console.log('\n⚠️  STILL FOUND TRIPLE QUOTES PATTERN!');
    
    let pos = 0;
    while ((pos = csvRow.indexOf('""",', pos)) !== -1) {
        const before = csvRow.substring(Math.max(0, pos - 15), pos);
        const after = csvRow.substring(pos, pos + 15);
        console.log(`Position ${pos}: ...${before}[""",]${after.substring(4)}...`);
        pos += 4;
    }
} else {
    console.log('\n✅ SUCCESS! No triple quotes pattern found with null fix!');
}

// Test specifically what happens with null vs empty string
console.log('\n=== Comparing null vs empty string ===');
console.log(`escapeCSV(null): "${escapeCSV(null)}"`);
console.log(`escapeCSV(''): "${escapeCSV('')}"`);
console.log('Both should produce the same result (empty string)');
