#!/usr/bin/env node

// Fix for proper import/export cycle handling

console.log('🔄 Testing Import/Export Cycle Fix\n');

// Current escapeCSV function (fixed version)
function escapeCSV(value) {
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}

// Enhanced parseCSVLine function
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

// NEW: Helper function to clean imported field values
function cleanImportedField(value) {
    if (!value || value.trim() === '') {
        return null;  // Convert empty strings to null for proper round-trip
    }
    // Remove surrounding quotes if present
    const cleaned = value.replace(/^"(.*)"$/, '$1');
    // Handle escaped quotes
    return cleaned.replace(/""/g, '"');
}

console.log('🧪 Testing the import/export cycle:\n');

// Simulate importing the problematic Sengir Vampire line
const csvLine = '"374437","Magic","9th Edition","Sengir Vampire","","","R","Lightly Played","0.41","","1.4800","0.1700","1","0","0.9800",""';

console.log('1. Original CSV line:');
console.log(csvLine);

console.log('\n2. Parsing CSV line:');
const parsedFields = parseCSVLine(csvLine);
parsedFields.forEach((field, index) => {
    console.log(`   Field ${index}: ${JSON.stringify(field)}`);
});

console.log('\n3. Cleaning imported fields:');
const cleanedFields = parsedFields.map((field, index) => {
    const cleaned = cleanImportedField(field);
    console.log(`   Field ${index}: ${JSON.stringify(field)} -> ${JSON.stringify(cleaned)}`);
    return cleaned;
});

console.log('\n4. Creating card object with cleaned data:');
const importedCard = {
    tcgplayerId: cleanedFields[0],
    productLine: cleanedFields[1],
    setName: cleanedFields[2],
    productName: cleanedFields[3],
    title: cleanedFields[4],        // Should be null
    number: cleanedFields[5],       // Should be null
    rarity: cleanedFields[6],
    condition: cleanedFields[7],
    tcgMarketPrice: parseFloat(cleanedFields[8]) || 0,
    tcgDirectLow: cleanedFields[9], // Should be null
    // ... other fields
};

console.log('Imported card object:');
Object.entries(importedCard).forEach(([key, value]) => {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
});

console.log('\n5. Re-exporting with fixed escapeCSV:');
const reExportedRow = [
    escapeCSV(importedCard.tcgplayerId),
    escapeCSV(importedCard.productLine),
    escapeCSV(importedCard.setName),
    escapeCSV(importedCard.productName),
    escapeCSV(importedCard.title),      // null -> empty field
    escapeCSV(importedCard.number),     // null -> empty field
    escapeCSV(importedCard.rarity),
    escapeCSV(importedCard.condition),
    escapeCSV(importedCard.tcgMarketPrice?.toString()),
    escapeCSV(importedCard.tcgDirectLow) // null -> empty field
];

const reExportedLine = reExportedRow.join(',');
console.log('Re-exported CSV line:');
console.log(reExportedLine);

console.log('\n📊 Comparison:');
console.log('Original:    ' + csvLine);
console.log('Re-exported: ' + reExportedLine);

// Check if we've achieved proper round-trip conversion
const originalEmptyFields = (csvLine.match(/""/g) || []).length;
const reExportedEmptyFields = (reExportedLine.match(/,,/g) || []).length + 
                              (reExportedLine.endsWith(',') ? 1 : 0);

console.log(`\n✅ Empty field conversion:`);
console.log(`   Original had ${originalEmptyFields} quoted empty fields (""`);
console.log(`   Re-exported has ${reExportedEmptyFields} truly empty fields (,,)`);

if (reExportedEmptyFields > 0 && originalEmptyFields > 0) {
    console.log('🎉 Success! Empty fields properly converted from "" to empty');
} else {
    console.log('⚠️  Need to verify the conversion logic');
}
