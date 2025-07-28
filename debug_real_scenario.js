#!/usr/bin/env node

// Test the actual scenario that might be causing the issue

function escapeCSV(value) {
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

console.log('🔍 Testing real-world scenarios that might cause """, patterns:\n');

// Test case 1: Card with missing collector_number
console.log('1. Card with missing collector_number:');
const card1 = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: null,  // This could be the issue
    rarity: 'common',
    prices: { usd: '1.50' }
};

const item1 = { condition: 'Near Mint', quantity: '1', price: 1.50 };

console.log('   collector_number:', JSON.stringify(card1.collector_number));
console.log('   collector_number || "":', JSON.stringify(card1.collector_number || ''));
console.log('   escapeCSV result:', JSON.stringify(escapeCSV(card1.collector_number || '')));

// Test case 2: Card with undefined collector_number
console.log('\n2. Card with undefined collector_number:');
const card2 = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    // collector_number is undefined
    rarity: 'common',
    prices: { usd: '1.50' }
};

console.log('   collector_number:', JSON.stringify(card2.collector_number));
console.log('   collector_number || "":', JSON.stringify(card2.collector_number || ''));
console.log('   escapeCSV result:', JSON.stringify(escapeCSV(card2.collector_number || '')));

// Test case 3: Card with empty string collector_number
console.log('\n3. Card with empty string collector_number:');
const card3 = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: '',
    rarity: 'common',
    prices: { usd: '1.50' }
};

console.log('   collector_number:', JSON.stringify(card3.collector_number));
console.log('   collector_number || "":', JSON.stringify(card3.collector_number || ''));
console.log('   escapeCSV result:', JSON.stringify(escapeCSV(card3.collector_number || '')));

// Test case 4: What if the issue is with rarity?
console.log('\n4. Card with missing rarity:');
const card4 = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: '001',
    rarity: null,
    prices: { usd: '1.50' }
};

console.log('   rarity:', JSON.stringify(card4.rarity));
console.log('   rarity ? rarity.charAt(0).toUpperCase() : "":', JSON.stringify(card4.rarity ? card4.rarity.charAt(0).toUpperCase() : ''));
console.log('   escapeCSV result:', JSON.stringify(escapeCSV(card4.rarity ? card4.rarity.charAt(0).toUpperCase() : '')));

// Test case 5: What if the issue is with image_uris?
console.log('\n5. Card with missing image_uris:');
const card5 = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: '001',
    rarity: 'common',
    prices: { usd: '1.50' }
    // No image_uris property
};

console.log('   image_uris:', JSON.stringify(card5.image_uris));
console.log('   image_uris?.normal:', JSON.stringify(card5.image_uris?.normal));
console.log('   image_uris?.large:', JSON.stringify(card5.image_uris?.large));
console.log('   full expression:', JSON.stringify(card5.image_uris?.normal || card5.image_uris?.large || ''));
console.log('   escapeCSV result:', JSON.stringify(escapeCSV(card5.image_uris?.normal || card5.image_uris?.large || '')));

// Now let's build a complete row with problematic data
console.log('\n🧪 Building complete CSV row with potentially problematic data:\n');

const problematicCard = {
    tcgplayer_id: '12345',
    set_name: 'Test Set',
    name: 'Test Card',
    collector_number: null,  // This might cause issues
    rarity: null,           // This might cause issues
    prices: { usd: '1.50' }
    // No image_uris - this might cause issues
};

const problematicItem = { condition: 'Near Mint', quantity: '1', price: 1.50 };

const row = [
    escapeCSV(problematicCard.tcgplayer_id || ''),
    escapeCSV('Magic'),
    escapeCSV(problematicCard.set_name || ''),
    escapeCSV(problematicCard.name || ''),
    escapeCSV(''),  // Title field
    escapeCSV(problematicCard.collector_number || ''),
    escapeCSV(problematicCard.rarity ? problematicCard.rarity.charAt(0).toUpperCase() : ''),
    escapeCSV(problematicItem.condition || 'Near Mint'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV('0'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV(problematicCard.prices?.usd || '0'),
    escapeCSV(problematicItem.quantity || '1'),
    escapeCSV('0'),
    escapeCSV(problematicItem.price?.toFixed(2) || '0'),
    escapeCSV(problematicCard.image_uris?.normal || problematicCard.image_uris?.large || '')
];

console.log('Row fields:');
row.forEach((field, index) => {
    console.log(`  ${index}: ${JSON.stringify(field)}`);
});

const csvLine = row.join(',');
console.log('\nGenerated CSV line:');
console.log(csvLine);

// Check for problematic patterns
if (csvLine.includes('""",')) {
    console.log('\n❌ Found problematic pattern: """,');
} else {
    console.log('\n✅ No problematic patterns found');
}

// Check for empty quoted strings
if (csvLine.includes('""')) {
    console.log('⚠️  Found empty quoted strings: ""');
} else {
    console.log('✅ No empty quoted strings found');
}
