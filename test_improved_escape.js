// Test the improved escapeCSV function
console.log('Testing improved CSV escaping behavior...\n');

// Improved escapeCSV function
function escapeCSV(value) {
    console.log(`Input: ${JSON.stringify(value)} (type: ${typeof value})`);
    
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        console.log('  -> Empty/whitespace field, returning empty string');
        return '';
    }
    
    const str = String(value).trim();  // Trim whitespace from all values
    console.log(`  -> Trimmed string value: "${str}"`);
    
    // Only quote if the string contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        const result = '"' + str.replace(/"/g, '""') + '"';
        console.log(`  -> Needs quoting, result: ${result}`);
        return result;
    }
    
    console.log(`  -> No quoting needed, result: ${str}`);
    return str;
}

// Test problematic values
const testValues = [
    null,
    undefined,
    '',
    ' ',           // Single space - should now be empty
    '  ',          // Multiple spaces - should now be empty
    '\t',          // Tab - should now be empty
    ' \t \n ',     // Mixed whitespace - should now be empty
    'normal text',
    ' normal text ',  // Text with surrounding spaces - should be trimmed
    'text, with comma',
    'text "with quotes"',
    0,
    '0'
];

console.log('Testing various input values:\n');
testValues.forEach((value, index) => {
    console.log(`Test ${index + 1}:`);
    const result = escapeCSV(value);
    console.log(`Result: "${result}"\n`);
});

// Test CSV row construction
console.log('Testing CSV row construction:');
const testRow = [
    '',           // Empty
    ' ',          // Space - should now be empty
    'normal',     // Normal text
    ' normal ',   // Text with spaces - should be trimmed
    null,         // Null
    undefined     // Undefined
];

console.log('Row values:', testRow.map(v => JSON.stringify(v)));
const csvRow = testRow.map(escapeCSV).join(',');
console.log('CSV row:', csvRow);
console.log('CSV row with visual markers:', csvRow.replace(/,/g, '|,|'));
