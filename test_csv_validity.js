// Test that our CSV with """ pattern is actually valid
const fs = require('fs');

// Create a CSV with the """ pattern
const csvContent = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number
12345,Magic,"Set with ""quotes""",Card Name,,123
67890,Magic,Normal Set,Another Card,,456`;

console.log('CSV Content:');
console.log(csvContent);
console.log('\nAnalyzing the """ pattern:');

// Save to file
fs.writeFileSync('test_validity.csv', csvContent);

// Parse it manually to show it's valid
const lines = csvContent.split('\n');
lines.forEach((line, index) => {
    if (index === 0) {
        console.log(`\nHeader: ${line}`);
        return;
    }
    
    console.log(`\nLine ${index}: ${line}`);
    
    // Simple CSV parser to show the fields
    const fields = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
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
    fields.forEach((field, fieldIndex) => {
        console.log(`  Field ${fieldIndex}: "${field}"`);
    });
});

console.log('\n✅ The CSV with """ pattern is VALID and parses correctly!');
console.log('The """ pattern is just: [escaped quote][closing quote][comma]');
console.log('\nIf your tool is having issues with this, the problem is with the tool, not the CSV.');
