/**
 * Simple Integration Test: Quantity Update Quote Handling
 * 
 * This test specifically validates the fix for the quote handling bug
 * in the updateCardQuantity function. Can be run with basic Node.js.
 */

const fs = require('fs');
const path = require('path');
const TestDataLoader = require('./test-data-loader');

// Initialize test data loader
const testDataLoader = new TestDataLoader();

// Extract the updateCardQuantity function from pricing.html
function extractUpdateCardQuantityFunction() {
    const pricingHtmlPath = path.join(__dirname, '../pricing.html');
    const pricingHtml = fs.readFileSync(pricingHtmlPath, 'utf8');
    
    // Find the function definition
    const functionMatch = pricingHtml.match(/function updateCardQuantity\(input, cardId\) \{[\s\S]*?\n            \}/);
    if (!functionMatch) {
        throw new Error('Could not extract updateCardQuantity function from pricing.html');
    }
    
    return functionMatch[0];
}

// Test environment setup using centralized data
function createTestEnvironment() {
    const testEnv = testDataLoader.createTestEnvironment();
    
    // Create the function in our test environment
    const functionCode = extractUpdateCardQuantityFunction();
    const wrappedFunction = `
        (function() {
            const pricingService = testEnv.pricingService;
            const exportBtn = testEnv.exportBtn;
            const updateStats = testEnv.updateStats;
            const showStatus = testEnv.showStatus;
            const console = testEnv.console;
            
            ${functionCode}
            
            return updateCardQuantity;
        })()
    `;
    
    testEnv.updateCardQuantity = eval(wrappedFunction);
    return testEnv;
}

// Test runner
function runTests() {
    console.log('🧪 Running Quantity Update Tests\n');
    
    let totalTests = 0;
    let passedTests = 0;
    
    function test(name, testFn) {
        totalTests++;
        try {
            const testEnv = createTestEnvironment();
            testFn(testEnv);
            console.log(`✅ ${name}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    function expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Expected value to be defined');
                }
            }
        };
    }
    
    // Core regression tests for the quote handling bug
    test('handles single quotes (HTML template case)', (testEnv) => {
        const mockInput = { value: '5' };
        testEnv.updateCardQuantity(mockInput, "'8728925'");
        
        const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
        expect(card).toBeDefined();
        expect(card.totalQuantity).toBe(5);
    });
    
    test('handles double quotes', (testEnv) => {
        const mockInput = { value: '3' };
        testEnv.updateCardQuantity(mockInput, '"5400291"');
        
        const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '5400291');
        expect(card).toBeDefined();
        expect(card.totalQuantity).toBe(3);
    });
    
    test('handles no quotes (direct case)', (testEnv) => {
        const mockInput = { value: '225' };
        testEnv.updateCardQuantity(mockInput, '8755665');
        
        const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8755665');
        expect(card).toBeDefined();
        expect(card.totalQuantity).toBe(225);
    });
    
    // Test the original failing cases using data from CSV
    testDataLoader.getOriginalFailingCases().forEach(({ cardId, newQuantity, originalQuantity, description }) => {
        test(`original failing case: ${description}`, (testEnv) => {
            const cleanId = cardId.replace(/^['"]|['"]$/g, '');
            const originalCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === cleanId);
            expect(originalCard.totalQuantity).toBe(originalQuantity);
            
            const mockInput = { value: newQuantity.toString() };
            testEnv.updateCardQuantity(mockInput, cardId);
            
            expect(originalCard.totalQuantity).toBe(newQuantity);
        });
    });
    
    // Test quote handling cases using data from CSV
    testDataLoader.getQuoteHandlingCases().forEach(({ input, cardId, expectedId, description }) => {
        test(`handles ${description.toLowerCase()}`, (testEnv) => {
            const mockInput = { value: input };
            testEnv.updateCardQuantity(mockInput, cardId);
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === expectedId);
            expect(card).toBeDefined();
            expect(card.totalQuantity).toBe(parseInt(input));
        });
    });
    
    test('handles zero quantity', (testEnv) => {
        const mockInput = { value: '0' };
        testEnv.updateCardQuantity(mockInput, "'8728925'");
        
        const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
        expect(card.totalQuantity).toBe(0);
    });
    
    test('handles invalid input gracefully', (testEnv) => {
        const mockInput = { value: 'abc' };
        testEnv.updateCardQuantity(mockInput, "'8728925'");
        
        const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
        expect(card.totalQuantity).toBe(0); // parseInt('abc') || 0
    });
    
    test('handles non-existent card ID', (testEnv) => {
        const originalQuantities = testEnv.pricingService.cards.map(c => c.totalQuantity);
        
        const mockInput = { value: '10' };
        testEnv.updateCardQuantity(mockInput, "'9999999'"); // Non-existent ID
        
        // All original quantities should be unchanged
        testEnv.pricingService.cards.forEach((card, index) => {
            expect(card.totalQuantity).toBe(originalQuantities[index]);
        });
    });
    
    test('simulates HTML template generation', (testEnv) => {
        // Simulate what the HTML template does
        const card = { tcgplayerId: '8728925' };
        const generatedOnClick = `updateCardQuantity(this, '${card.tcgplayerId}')`;
        
        // Extract the parameter (what the browser would pass)
        const match = generatedOnClick.match(/updateCardQuantity\(this, '(.+)'\)/);
        if (!match) throw new Error('Failed to extract card ID from generated HTML');
        
        const extractedCardId = match[1];
        
        // Test that our function handles this correctly
        const mockInput = { value: '99' };
        testEnv.updateCardQuantity(mockInput, `'${extractedCardId}'`);
        
        const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === extractedCardId);
        expect(updatedCard.totalQuantity).toBe(99);
    });
    
    // Summary
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! The quantity update fix is working correctly.');
        return true;
    } else {
        console.log('⚠️  Some tests failed. The quantity update functionality may have regressed.');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests, createTestEnvironment };
