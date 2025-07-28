// Test the exact scenario that might be causing the issue
console.log('Testing exact scenario with Title and Photo URL empty...\n');

// The exact escapeCSV function from the current code
const escapeCSV = (value) => {
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value).trim();  // Trim whitespace from all values
    // Only quote if the string contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;  // Return unquoted for simple values
};

// Test a scenario that might cause the issue
console.log('=== Testing potential problematic scenario ===');

// What if the issue is with the field BEFORE Title or Photo URL?
const problematicCard = {
    tcgplayer_id: 12345,
    set_name: 'Set with "quotes"',  // This needs quoting
    name: 'Card Name',
    collector_number: '123',
    rarity: 'common',
    prices: { usd: '1.00' },
    image_uris: null  // Empty photo URL
};

const item = {
    quantity: 1,
    condition: 'Near Mint',
    price: 1.50
};

console.log('Building row with problematic set name...');

const row = [
    escapeCSV(problematicCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(problematicCard.set_name || ''),  // This will be quoted
    escapeCSV(problematicCard.name || ''),
    escapeCSV(''),  // Title - empty
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
    escapeCSV(problematicCard.image_uris?.normal || problematicCard.image_uris?.large || '')  // Photo URL - empty
];

console.log('\nField by field:');
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

// Check for the pattern
if (csvRow.includes('""",')) {
    console.log('\n⚠️  FOUND TRIPLE QUOTES PATTERN!');
    
    // Find all occurrences
    let pos = 0;
    while ((pos = csvRow.indexOf('""",', pos)) !== -1) {
        const before = csvRow.substring(Math.max(0, pos - 15), pos);
        const after = csvRow.substring(pos, pos + 15);
        console.log(`Position ${pos}: ...${before}[""",]${after.substring(4)}...`);
        pos += 4;
    }
} else {
    console.log('\n✓ No triple quotes pattern found');
}

// Let's also test what happens if we have a quoted field followed by multiple empty fields
console.log('\n=== Testing quoted field followed by empty fields ===');

const testRow = [
    'normal',
    '"quoted field"',
    '',  // Empty
    '',  // Empty  
    '',  // Empty
    'normal'
];

const testCsv = testRow.join(',');
console.log(`Test CSV: ${testCsv}`);

// What if the issue is in how JavaScript handles the string concatenation?
console.log('\n=== Testing string concatenation edge cases ===');

const quotedField = escapeCSV('Field with "quotes"');
const emptyField1 = escapeCSV('');
const emptyField2 = escapeCSV('');

console.log(`Quoted field: ${quotedField}`);
console.log(`Empty field 1: "${emptyField1}"`);
console.log(`Empty field 2: "${emptyField2}"`);

const concatenated = [quotedField, emptyField1, emptyField2].join(',');
console.log(`Concatenated: ${concatenated}`);

if (concatenated.includes('""",')) {
    console.log('⚠️  Found triple quotes in concatenation test!');
} else {
    console.log('✓ No triple quotes in concatenation test');
}
