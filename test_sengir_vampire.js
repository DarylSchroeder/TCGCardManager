#!/usr/bin/env node

// Test the exact Sengir Vampire case

function escapeCSV(value) {
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

console.log('🧛 Testing Sengir Vampire case specifically:\n');

// Simulate the Sengir Vampire card data that would cause the issue
const sengirCard = {
    tcgplayer_id: '374437',
    set_name: '9th Edition',
    name: 'Sengir Vampire',
    collector_number: null,  // This is likely missing/null
    rarity: 'rare',
    prices: { usd: '0.41' }
    // No image_uris
};

const sengirItem = {
    condition: 'Lightly Played',
    quantity: '1',
    price: 0.98
};

console.log('Card data:');
console.log('  tcgplayer_id:', JSON.stringify(sengirCard.tcgplayer_id));
console.log('  name:', JSON.stringify(sengirCard.name));
console.log('  collector_number:', JSON.stringify(sengirCard.collector_number));
console.log('  rarity:', JSON.stringify(sengirCard.rarity));

console.log('\nTesting individual fields:');
console.log('  Title field escapeCSV(""):', JSON.stringify(escapeCSV('')));
console.log('  Collector number escapeCSV(null || ""):', JSON.stringify(escapeCSV(sengirCard.collector_number || '')));
console.log('  Image field escapeCSV(undefined || ""):', JSON.stringify(escapeCSV(sengirCard.image_uris?.normal || sengirCard.image_uris?.large || '')));

console.log('\n🔧 Building the complete CSV row:\n');

const row = [
    escapeCSV(sengirCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(sengirCard.set_name || ''),
    escapeCSV(sengirCard.name || ''),
    escapeCSV(''),  // Title field - should be empty
    escapeCSV(sengirCard.collector_number || ''),  // Should be empty
    escapeCSV(sengirCard.rarity ? sengirCard.rarity.charAt(0).toUpperCase() : ''),
    escapeCSV(sengirItem.condition || 'Near Mint'),
    escapeCSV(sengirCard.prices?.usd || '0'),
    escapeCSV('0'),
    escapeCSV(sengirCard.prices?.usd || '0'),
    escapeCSV(sengirCard.prices?.usd || '0'),
    escapeCSV(sengirItem.quantity || '1'),
    escapeCSV('0'),
    escapeCSV(sengirItem.price?.toFixed(2) || '0'),
    escapeCSV(sengirCard.image_uris?.normal || sengirCard.image_uris?.large || '')  // Should be empty
];

console.log('Generated row fields:');
row.forEach((field, index) => {
    console.log(`  ${index}: ${JSON.stringify(field)}`);
});

const csvLine = row.join(',');
console.log('\nGenerated CSV line:');
console.log(csvLine);

console.log('\n📊 Comparison with actual CSV file:');
console.log('Expected (our function): ' + csvLine);
console.log('Actual (from file):     "374437","Magic","9th Edition","Sengir Vampire","","","R","Lightly Played","0.41","","1.4800","0.1700","1","0","0.9800",""');

// Check for differences
const actualFromFile = '"374437","Magic","9th Edition","Sengir Vampire","","","R","Lightly Played","0.41","","1.4800","0.1700","1","0","0.9800",""';

if (csvLine === actualFromFile) {
    console.log('\n✅ Perfect match!');
} else {
    console.log('\n❌ Mismatch detected!');
    console.log('\nDifferences:');
    
    // Find where they differ
    const expectedFields = csvLine.split(',');
    const actualFields = actualFromFile.split(',');
    
    for (let i = 0; i < Math.max(expectedFields.length, actualFields.length); i++) {
        const expected = expectedFields[i] || 'MISSING';
        const actual = actualFields[i] || 'MISSING';
        
        if (expected !== actual) {
            console.log(`  Field ${i}: Expected ${JSON.stringify(expected)}, Got ${JSON.stringify(actual)}`);
        }
    }
}
