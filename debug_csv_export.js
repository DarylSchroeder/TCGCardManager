// Debug script to test CSV escaping behavior
console.log('Testing CSV escaping behavior...\n');

// Test the current escapeCSV function
function escapeCSV(value) {
    console.log(`Input: ${JSON.stringify(value)} (type: ${typeof value})`);
    
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        console.log('  -> Empty field, returning empty string');
        return '';
    }
    
    const str = String(value);
    console.log(`  -> String value: "${str}"`);
    
    // Only quote if the string contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        const result = '"' + str.replace(/"/g, '""') + '"';
        console.log(`  -> Needs quoting, result: ${result}`);
        return result;
    }
    
    console.log(`  -> No quoting needed, result: ${str}`);
    return str;
}

// Test various values
const testValues = [
    null,
    undefined,
    '',
    ' ',           // Single space
    '  ',          // Multiple spaces
    '\t',          // Tab
    '\n',          // Newline
    'normal text',
    'text, with comma',
    'text "with quotes"',
    0,
    '0',
    false,
    'false'
];

console.log('Testing various input values:\n');
testValues.forEach((value, index) => {
    console.log(`Test ${index + 1}:`);
    const result = escapeCSV(value);
    console.log(`Result: "${result}"\n`);
});

// Test what happens when we join with commas
console.log('Testing CSV row construction:');
const testRow = [
    '',           // Empty
    ' ',          // Space
    'normal',     // Normal text
    null,         // Null
    undefined     // Undefined
];

console.log('Row values:', testRow.map(v => JSON.stringify(v)));
const csvRow = testRow.map(escapeCSV).join(',');
console.log('CSV row:', csvRow);
console.log('CSV row with visual markers:', csvRow.replace(/,/g, '|,|'));
