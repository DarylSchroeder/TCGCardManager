/**
 * Integration Test: Quantity Update Function Scope
 * 
 * This test validates that the updateCardQuantity function is properly
 * defined in global scope, not trapped inside DOMContentLoaded.
 * 
 * This test would have caught the "function not defined" scope error
 * that prevented HTML onchange handlers from working.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Quantity Update Function Scope Test\n');

function testFunctionScope() {
    const results = [];
    
    try {
        // Read the actual pricing.html file
        const pricingHtmlPath = path.join(__dirname, '../pricing.html');
        const pricingHtml = fs.readFileSync(pricingHtmlPath, 'utf8');
        
        // Test 1: Function should be defined OUTSIDE DOMContentLoaded
        const domContentLoadedMatch = pricingHtml.match(/document\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);/);
        const functionMatch = pricingHtml.match(/function updateCardQuantity\(input, cardId\) \{[\s\S]*?\n        \}/);
        
        if (!functionMatch) {
            results.push({
                test: 'Function Definition Exists',
                passed: false,
                message: 'updateCardQuantity function not found in HTML'
            });
            return results;
        }
        
        results.push({
            test: 'Function Definition Exists',
            passed: true,
            message: 'updateCardQuantity function found'
        });
        
        // Test 2: Function should be OUTSIDE the DOMContentLoaded block
        if (domContentLoadedMatch) {
            const domContentLoadedBlock = domContentLoadedMatch[0];
            const functionInDOMBlock = domContentLoadedBlock.includes('function updateCardQuantity');
            
            results.push({
                test: 'Function Scope (Outside DOMContentLoaded)',
                passed: !functionInDOMBlock,
                message: functionInDOMBlock 
                    ? 'CRITICAL: Function is inside DOMContentLoaded - will cause "not defined" errors'
                    : 'Function is properly outside DOMContentLoaded block'
            });
        }
        
        // Test 3: Function should use window.pricingService (global access pattern)
        const functionCode = functionMatch[0];
        const usesWindowAccess = functionCode.includes('window.pricingService') && functionCode.includes('window.updateStats');
        
        results.push({
            test: 'Global Variable Access Pattern',
            passed: usesWindowAccess,
            message: usesWindowAccess
                ? 'Function properly accesses global variables via window object'
                : 'Function may not access global variables correctly'
        });
        
        // Test 4: Check for HTML onchange handlers that would call this function
        const hasOnchangeHandlers = pricingHtml.includes('onchange="updateCardQuantity(');
        
        results.push({
            test: 'HTML Integration (onchange handlers)',
            passed: hasOnchangeHandlers,
            message: hasOnchangeHandlers
                ? 'HTML contains onchange handlers that call updateCardQuantity'
                : 'No HTML onchange handlers found - integration may be missing'
        });
        
        // Test 5: Simulate the exact error condition that was fixed
        // Extract just the script content and check if function would be accessible
        const scriptMatch = pricingHtml.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            const scriptContent = scriptMatch[1];
            
            // More precise check: function should be defined AFTER the DOMContentLoaded block closes
            const domContentLoadedEnd = scriptContent.indexOf('        });');
            const functionStart = scriptContent.indexOf('function updateCardQuantity');
            
            const functionAtTopLevel = functionStart > domContentLoadedEnd && domContentLoadedEnd !== -1;
            
            results.push({
                test: 'Function Accessibility (Top-level scope)',
                passed: functionAtTopLevel,
                message: functionAtTopLevel
                    ? 'Function is defined after DOMContentLoaded block (globally accessible)'
                    : 'CRITICAL: Function is nested inside event listener (not globally accessible)'
            });
        }
        
    } catch (error) {
        results.push({
            test: 'Test Execution',
            passed: false,
            message: `Test failed with error: ${error.message}`
        });
    }
    
    return results;
}

// Run the test
const results = testFunctionScope();

console.log('📊 Test Results:');
console.log('================');

let allPassed = true;
results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.message}`);
    if (!result.passed) allPassed = false;
});

console.log('\n📋 Summary:');
if (allPassed) {
    console.log('🎉 All scope tests PASSED!');
    console.log('   The updateCardQuantity function is properly structured for HTML integration');
    console.log('   This prevents the "function not defined" error that was previously occurring');
} else {
    console.log('❌ Some scope tests FAILED!');
    console.log('   The function may not be accessible from HTML onchange handlers');
    console.log('   This could cause "ReferenceError: updateCardQuantity is not defined" errors');
}

process.exit(allPassed ? 0 : 1);
