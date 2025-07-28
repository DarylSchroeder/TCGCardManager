// Test the ACTUAL problematic pattern - index 4 (Title) being """
console.log('Testing the ACTUAL problematic pattern...\n');

// The REAL problem: Title field (index 4) contains """ as a standalone field
const correctTestString = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number
12345,Magic,"Set with quotes",Card Name,""",123
67890,Magic,Normal Set,Another Card,""",456
98765,Magic,Third Set,Third Card,""",789`;

console.log('=== CORRECT TEST CASE ===');
console.log('The problem is Title field (index 4) containing """ as standalone field:');
console.log(correctTestString);

console.log('\n=== ANALYZING THE PATTERN ===');

// Look for the actual pattern: ,"",
const actualPattern = /,""",/g;
const matches = correctTestString.match(actualPattern);

console.log('Pattern /,""",/g matches:', matches);
console.log('Number of matches:', matches ? matches.length : 0);

// Show where each match occurs
if (matches) {
    let searchPos = 0;
    matches.forEach((match, index) => {
        const pos = correctTestString.indexOf(match, searchPos);
        const before = correctTestString.substring(Math.max(0, pos - 10), pos);
        const after = correctTestString.substring(pos + match.length, pos + match.length + 10);
        console.log(`Match ${index + 1} at position ${pos}: ...${before}[${match}]${after}...`);
        searchPos = pos + 1;
    });
}

// Apply the cleanup
console.log('\n=== APPLYING CLEANUP ===');
let cleaned = correctTestString;
cleaned = cleaned.replace(/,""",/g, ',,');
cleaned = cleaned.replace(/,"""\n/g, ',\n');

console.log('After cleanup:');
console.log(cleaned);

// Verify the cleanup worked
const remainingMatches = cleaned.match(/,""",/g);
console.log('\nRemaining ,""", patterns:', remainingMatches ? remainingMatches.length : 0);

if (!remainingMatches || remainingMatches.length === 0) {
    console.log('✅ SUCCESS! Pattern cleaned up correctly');
} else {
    console.log('❌ FAILED! Pattern still exists');
}

// Test parsing the cleaned result
console.log('\n=== PARSING TEST ===');
const lines = cleaned.split('\n');
const testLine = lines[1]; // First data line
console.log(`Test line: ${testLine}`);

// Parse the line
const fields = [];
let current = '';
let inQuotes = false;
let i = 0;

while (i < testLine.length) {
    const char = testLine[i];
    
    if (char === '"') {
        if (inQuotes && testLine[i + 1] === '"') {
            current += '"';
            i += 2;
        } else {
            inQuotes = !inQuotes;
            i++;
        }
    } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
        i++;
    } else {
        current += char;
        i++;
    }
}
fields.push(current);

console.log('Parsed fields:');
const fieldNames = ['TCGplayer Id', 'Product Line', 'Set Name', 'Product Name', 'Title', 'Number'];
fields.forEach((field, index) => {
    console.log(`  ${fieldNames[index]}: "${field}"`);
});

console.log('\n✅ Title field is now properly empty instead of """');
