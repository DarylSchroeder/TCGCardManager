// Test how the regex handles quotes
console.log('Testing regex quote handling...\n');

// Test string with the problematic pattern
const testString = `12345,Magic,"Set with ""quotes""",Card Name,""",123,C,Near Mint,1.00
67890,Magic,Normal Set,Another Card,,456,R,Near Mint,2.00,"""`;

console.log('=== ORIGINAL STRING ===');
console.log(testString);

console.log('\n=== TESTING REGEX PATTERNS ===');

// Test the current regex patterns
const pattern1 = /,""",/g;
const pattern2 = /,"""\n/g;

console.log('Pattern 1: /,""",/g');
console.log('Pattern 2: /,"""\n/g');

// Find matches
const matches1 = testString.match(pattern1);
const matches2 = testString.match(pattern2);

console.log('\nMatches for pattern 1 (,""",):', matches1);
console.log('Matches for pattern 2 (,"""\n):', matches2);

// Apply the replacements
let cleaned = testString;
cleaned = cleaned.replace(pattern1, ',,');
cleaned = cleaned.replace(pattern2, ',\n');

console.log('\n=== AFTER REPLACEMENT ===');
console.log(cleaned);

// Test if we need to escape quotes
console.log('\n=== TESTING ESCAPED QUOTES ===');

const escapedPattern1 = /,\"\"\",/g;
const escapedPattern2 = /,\"\"\"\n/g;

console.log('Escaped Pattern 1: /,\\"\\"\\",/g');
console.log('Escaped Pattern 2: /,\\"\\"\\"\n/g');

const escapedMatches1 = testString.match(escapedPattern1);
const escapedMatches2 = testString.match(escapedPattern2);

console.log('Escaped matches 1:', escapedMatches1);
console.log('Escaped matches 2:', escapedMatches2);

// Test both approaches
let cleanedEscaped = testString;
cleanedEscaped = cleanedEscaped.replace(escapedPattern1, ',,');
cleanedEscaped = cleanedEscaped.replace(escapedPattern2, ',\n');

console.log('\n=== COMPARISON ===');
console.log('Original approach result:');
console.log(cleaned);
console.log('\nEscaped approach result:');
console.log(cleanedEscaped);

console.log('\nAre results identical?', cleaned === cleanedEscaped);

// Test edge cases
console.log('\n=== EDGE CASE TESTING ===');

const edgeCases = [
    'field1,""",field3',           // Middle of line
    'field1,field2,"""',           // End of line (no newline)
    'field1,"""\nfield2,field3',   // End of line with newline
    'field1,"normal quotes",field3', // Normal quotes (should NOT match)
    'field1,"""",field3',          // Four quotes (should NOT match)
];

edgeCases.forEach((testCase, index) => {
    console.log(`\nEdge case ${index + 1}: ${JSON.stringify(testCase)}`);
    
    const originalMatches = testCase.match(/,""",/g) || [];
    const escapedMatches = testCase.match(/,\"\"\",/g) || [];
    
    console.log(`  Original regex matches: ${originalMatches.length}`);
    console.log(`  Escaped regex matches: ${escapedMatches.length}`);
    
    if (originalMatches.length !== escapedMatches.length) {
        console.log('  ⚠️  DIFFERENT RESULTS!');
    } else {
        console.log('  ✅ Same results');
    }
});
