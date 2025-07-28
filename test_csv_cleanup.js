// Test the CSV cleanup functionality
console.log('Testing CSV cleanup for triple quotes pattern...\n');

// Simulate the problematic CSV content
let csvContent = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Rarity,Condition,TCG Market Price,TCG Direct Low,TCG Low Price With Shipping,TCG Low Price,Total Quantity,Add to Quantity,TCG Marketplace Price,Photo URL
12345,Magic,"Set with ""quotes""",Card Name,""",123,C,Near Mint,1.00,0,1.00,1.00,1,0,1.50,"""
67890,Magic,Normal Set,Another Card,,456,R,Near Mint,2.00,0,2.00,2.00,2,0,2.50,
98765,Magic,"Another ""quoted"" set",Third Card,""",789,M,Near Mint,5.00,0,5.00,5.00,1,0,5.50,"""`;

console.log('=== BEFORE CLEANUP ===');
console.log('CSV Content:');
console.log(csvContent);
console.log('\nProblematic patterns found:');

// Count occurrences
const tripleQuoteComma = (csvContent.match(/,""",/g) || []).length;
const tripleQuoteNewline = (csvContent.match(/,"""\n/g) || []).length;

console.log(`,""", patterns: ${tripleQuoteComma}`);
console.log(`,"""\n patterns: ${tripleQuoteNewline}`);

// Apply the cleanup
console.log('\n=== APPLYING CLEANUP ===');
console.log('Original CSV length:', csvContent.length);

// Replace ,""", with ,, (empty field)
csvContent = csvContent.replace(/,""",/g, ',,');

// Replace ,"""\n with ,\n (empty field at end of line)
csvContent = csvContent.replace(/,"""\n/g, ',\n');

console.log('Cleaned CSV length:', csvContent.length);

console.log('\n=== AFTER CLEANUP ===');
console.log('CSV Content:');
console.log(csvContent);

// Verify cleanup worked
const remainingTripleQuoteComma = (csvContent.match(/,""",/g) || []).length;
const remainingTripleQuoteNewline = (csvContent.match(/,"""\n/g) || []).length;

console.log('\nRemaining problematic patterns:');
console.log(`,""", patterns: ${remainingTripleQuoteComma}`);
console.log(`,"""\n patterns: ${remainingTripleQuoteNewline}`);

if (remainingTripleQuoteComma === 0 && remainingTripleQuoteNewline === 0) {
    console.log('\n✅ SUCCESS! All triple quote patterns cleaned up!');
} else {
    console.log('\n❌ FAILED! Some patterns still remain.');
}

// Test that valid quoted fields are preserved
console.log('\n=== TESTING VALID QUOTES PRESERVATION ===');
const validQuotedFields = csvContent.match(/"[^"]*"/g) || [];
console.log('Valid quoted fields preserved:');
validQuotedFields.forEach((field, index) => {
    console.log(`  ${index + 1}: ${field}`);
});

// Parse a line to show it works correctly
console.log('\n=== PARSING TEST ===');
const lines = csvContent.split('\n');
const testLine = lines[1]; // First data line
console.log(`Test line: ${testLine}`);

// Simple CSV parser
const fields = [];
let current = '';
let inQuotes = false;
let i = 0;

while (i < testLine.length) {
    const char = testLine[i];
    
    if (char === '"') {
        if (inQuotes && testLine[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i += 2;
        } else {
            // Start or end of quoted field
            inQuotes = !inQuotes;
            i++;
        }
    } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current);
        current = '';
        i++;
    } else {
        current += char;
        i++;
    }
}
fields.push(current); // Last field

console.log('Parsed fields:');
fields.forEach((field, index) => {
    console.log(`  Field ${index}: "${field}"`);
});

console.log('\n✅ CSV cleanup test completed!');
