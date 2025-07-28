#!/usr/bin/env node

// Test the complete round-trip fix

// Updated functions from the fix
function parseCSVLine(line) {
    const fields = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        
        if (c === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Escaped quote (double quote within quoted field)
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            // Field separator
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += c;
        }
    }
    
    // Add last field
    fields.push(currentField);
    return fields;
}

function cleanImportedField(value) {
    if (!value || value.trim() === '') {
        return null;  // Convert empty strings to null for proper export
    }
    // Remove surrounding quotes if present
    const cleaned = value.replace(/^"(.*)"$/, '$1');
    // Handle escaped quotes
    return cleaned.replace(/""/g, '"');
}

function escapeCSV(value) {
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

console.log('🔄 Testing Complete Round-Trip Fix\n');

// Test with the actual Sengir Vampire line from the file
const originalLine = '"374437","Magic","9th Edition","Sengir Vampire","","","R","Lightly Played","0.41","","1.4800","0.1700","1","0","0.9800",""';

console.log('1. Original CSV line (with "" empty fields):');
console.log(originalLine);

console.log('\n2. Import process:');
const parsedFields = parseCSVLine(originalLine);
console.log('   Parsed fields:', parsedFields.length);

const cleanedFields = parsedFields.map(cleanImportedField);
console.log('   Cleaned fields (empty -> null):');
cleanedFields.forEach((field, index) => {
    if (field === null) {
        console.log(`     Field ${index}: null (was empty)`);
    }
});

console.log('\n3. Create simplified card object:');
const importedCard = {
    tcgplayerId: cleanedFields[0],
    productLine: cleanedFields[1], 
    setName: cleanedFields[2],
    productName: cleanedFields[3],
    title: cleanedFields[4],        // Should be null
    number: cleanedFields[5],       // Should be null  
    rarity: cleanedFields[6],
    condition: cleanedFields[7],
    tcgMarketPrice: cleanedFields[8],
    tcgDirectLow: cleanedFields[9], // Should be null
    // ... truncated for test
};

console.log('   Key fields:');
console.log(`     title: ${JSON.stringify(importedCard.title)}`);
console.log(`     number: ${JSON.stringify(importedCard.number)}`);
console.log(`     tcgDirectLow: ${JSON.stringify(importedCard.tcgDirectLow)}`);

console.log('\n4. Export process:');
const exportedRow = [
    escapeCSV(importedCard.tcgplayerId),
    escapeCSV(importedCard.productLine),
    escapeCSV(importedCard.setName),
    escapeCSV(importedCard.productName),
    escapeCSV(importedCard.title),      // null -> empty field
    escapeCSV(importedCard.number),     // null -> empty field
    escapeCSV(importedCard.rarity),
    escapeCSV(importedCard.condition),
    escapeCSV(importedCard.tcgMarketPrice),
    escapeCSV(importedCard.tcgDirectLow) // null -> empty field
];

const exportedLine = exportedRow.join(',');
console.log('   Exported CSV line (with empty fields):');
console.log(exportedLine);

console.log('\n📊 Comparison:');
console.log('Original:  ' + originalLine);
console.log('Exported:  ' + exportedLine);

// Count the transformations
const originalEmptyQuoted = (originalLine.match(/""/g) || []).length;
const exportedEmptyFields = exportedLine.split(',').filter(field => field === '').length;

console.log(`\n✅ Transformation Results:`);
console.log(`   Original: ${originalEmptyQuoted} quoted empty fields (""`);
console.log(`   Exported: ${exportedEmptyFields} truly empty fields`);

if (exportedEmptyFields > 0 && originalEmptyQuoted > 0) {
    console.log('🎉 SUCCESS: Empty fields properly converted from "" to empty!');
    console.log('   This eliminates the """, pattern issue.');
} else {
    console.log('❌ Issue: Conversion may not be working as expected');
}

console.log('\n🔍 Checking for problematic patterns:');
if (exportedLine.includes('""",')) {
    console.log('❌ Still found """, pattern');
} else {
    console.log('✅ No """, patterns found');
}

if (exportedLine.includes(',,')) {
    console.log('✅ Found proper empty field patterns (,,)');
} else {
    console.log('⚠️  No empty field patterns found');
}
