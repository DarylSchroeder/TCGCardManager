/**
 * Test Suite: Quantity Update Functionality
 * 
 * This test suite specifically covers the quantity update bug that was fixed,
 * ensuring that HTML template quote handling doesn't break card lookups.
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Load the TCG pricing module
const tcgPricingPath = path.join(__dirname, '../js/tcgPricing.js');
const tcgPricingCode = fs.readFileSync(tcgPricingPath, 'utf8');
eval(tcgPricingCode);

// Load the pricing HTML to extract the updateCardQuantity function
const pricingHtmlPath = path.join(__dirname, '../pricing.html');
const pricingHtml = fs.readFileSync(pricingHtmlPath, 'utf8');

// Extract the updateCardQuantity function from the HTML
const functionMatch = pricingHtml.match(/function updateCardQuantity\(input, cardId\) \{[\s\S]*?\n            \}/);
if (!functionMatch) {
    throw new Error('Could not extract updateCardQuantity function from pricing.html');
}

// Create a test environment with the function
const testEnv = {
    pricingService: null,
    exportBtn: { disabled: false },
    updateStats: () => {},
    showStatus: (message, type) => console.log(`Status: ${message} (${type})`),
    
    // The actual function from the HTML
    updateCardQuantity: null
};

// Evaluate the function in our test context
const functionCode = functionMatch[0].replace('function updateCardQuantity', 'testEnv.updateCardQuantity = function');
eval(functionCode);

describe('Quantity Update Functionality', () => {
    let mockCards;
    
    beforeEach(() => {
        // Create mock cards with realistic data
        mockCards = [
            {
                tcgplayerId: '8728925',
                productName: 'A Promise Fulfilled - Light Up the Stage (Showcase)',
                totalQuantity: 6,
                setName: 'FINAL FANTASY: Through the Ages',
                condition: 'Near Mint'
            },
            {
                tcgplayerId: '5400291',
                productName: 'Acquisition Octopus',
                totalQuantity: 1,
                setName: 'Kamigawa: Neon Dynasty',
                condition: 'Near Mint'
            },
            {
                tcgplayerId: '8755665',
                productName: 'Zidane, Tantalus Thief Art Card',
                totalQuantity: 2,
                setName: 'Art Series: FINAL FANTASY',
                condition: 'Near Mint'
            }
        ];
        
        // Mock the pricing service
        testEnv.pricingService = {
            cards: [...mockCards] // Create a copy
        };
    });
    
    describe('Card ID Quote Handling', () => {
        test('should handle card ID with single quotes (HTML template case)', () => {
            const mockInput = { value: '5' };
            const cardIdWithQuotes = "'8728925'"; // This is what HTML template generates
            
            // Call the function
            testEnv.updateCardQuantity(mockInput, cardIdWithQuotes);
            
            // Verify the card was found and updated
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(updatedCard).toBeDefined();
            expect(updatedCard.totalQuantity).toBe(5);
        });
        
        test('should handle card ID with double quotes', () => {
            const mockInput = { value: '3' };
            const cardIdWithQuotes = '"5400291"';
            
            testEnv.updateCardQuantity(mockInput, cardIdWithQuotes);
            
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === '5400291');
            expect(updatedCard).toBeDefined();
            expect(updatedCard.totalQuantity).toBe(3);
        });
        
        test('should handle card ID without quotes (direct case)', () => {
            const mockInput = { value: '225' };
            const cardIdWithoutQuotes = '8755665';
            
            testEnv.updateCardQuantity(mockInput, cardIdWithoutQuotes);
            
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8755665');
            expect(updatedCard).toBeDefined();
            expect(updatedCard.totalQuantity).toBe(225);
        });
        
        test('should handle mixed quote types gracefully', () => {
            const testCases = [
                { input: '10', cardId: "'8728925'", expectedId: '8728925' },
                { input: '20', cardId: '"8728925"', expectedId: '8728925' },
                { input: '30', cardId: '8728925', expectedId: '8728925' },
                { input: '40', cardId: "'8728925\"", expectedId: '8728925' }, // Mixed quotes
            ];
            
            testCases.forEach(({ input, cardId, expectedId }) => {
                const mockInput = { value: input };
                testEnv.updateCardQuantity(mockInput, cardId);
                
                const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === expectedId);
                expect(updatedCard).toBeDefined();
                expect(updatedCard.totalQuantity).toBe(parseInt(input));
            });
        });
    });
    
    describe('Quantity Update Logic', () => {
        test('should update quantity to positive number', () => {
            const mockInput = { value: '15' };
            testEnv.updateCardQuantity(mockInput, '8728925');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card.totalQuantity).toBe(15);
        });
        
        test('should handle zero quantity', () => {
            const mockInput = { value: '0' };
            testEnv.updateCardQuantity(mockInput, '5400291');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '5400291');
            expect(card.totalQuantity).toBe(0);
        });
        
        test('should handle negative input (should convert to 0)', () => {
            const mockInput = { value: '-5' };
            testEnv.updateCardQuantity(mockInput, '8755665');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8755665');
            expect(card.totalQuantity).toBe(0); // parseInt('-5') || 0 should be 0
        });
        
        test('should handle non-numeric input', () => {
            const mockInput = { value: 'abc' };
            testEnv.updateCardQuantity(mockInput, '8728925');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card.totalQuantity).toBe(0); // parseInt('abc') || 0 should be 0
        });
        
        test('should handle empty input', () => {
            const mockInput = { value: '' };
            testEnv.updateCardQuantity(mockInput, '5400291');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '5400291');
            expect(card.totalQuantity).toBe(0);
        });
    });
    
    describe('Error Handling', () => {
        test('should handle non-existent card ID gracefully', () => {
            const mockInput = { value: '10' };
            const nonExistentId = '9999999';
            
            // Should not throw an error
            expect(() => {
                testEnv.updateCardQuantity(mockInput, nonExistentId);
            }).not.toThrow();
            
            // Original cards should be unchanged
            expect(testEnv.pricingService.cards[0].totalQuantity).toBe(6);
            expect(testEnv.pricingService.cards[1].totalQuantity).toBe(1);
            expect(testEnv.pricingService.cards[2].totalQuantity).toBe(2);
        });
        
        test('should handle empty card ID', () => {
            const mockInput = { value: '10' };
            
            expect(() => {
                testEnv.updateCardQuantity(mockInput, '');
            }).not.toThrow();
        });
        
        test('should handle null/undefined card ID', () => {
            const mockInput = { value: '10' };
            
            expect(() => {
                testEnv.updateCardQuantity(mockInput, null);
            }).not.toThrow();
            
            expect(() => {
                testEnv.updateCardQuantity(mockInput, undefined);
            }).not.toThrow();
        });
    });
    
    describe('HTML Template Integration', () => {
        test('should simulate real HTML template behavior', () => {
            // Simulate what happens when the HTML template generates the onclick handler
            const card = mockCards[0]; // A Promise Fulfilled
            const generatedOnClick = `updateCardQuantity(this, '${card.tcgplayerId}')`;
            
            // Extract the card ID parameter (this simulates what the browser would do)
            const match = generatedOnClick.match(/updateCardQuantity\(this, '(.+)'\)/);
            expect(match).toBeTruthy();
            
            const extractedCardId = match[1];
            expect(extractedCardId).toBe(card.tcgplayerId);
            
            // Now test that our function handles this correctly
            const mockInput = { value: '99' };
            testEnv.updateCardQuantity(mockInput, `'${extractedCardId}'`);
            
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === card.tcgplayerId);
            expect(updatedCard.totalQuantity).toBe(99);
        });
    });
    
    describe('Regression Tests', () => {
        test('should handle the original failing test cases', () => {
            // These are the exact cases that were failing before the fix
            const originalFailingCases = [
                { cardId: "'8728925'", newQuantity: 5, originalQuantity: 6 }, // A Promise Fulfilled -1
                { cardId: "'5400291'", newQuantity: 3, originalQuantity: 1 }, // Acquisition Octopus +2  
                { cardId: "'8755665'", newQuantity: 225, originalQuantity: 2 } // Zidane +223
            ];
            
            originalFailingCases.forEach(({ cardId, newQuantity, originalQuantity }) => {
                const cleanId = cardId.replace(/^['"]|['"]$/g, '');
                const originalCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === cleanId);
                expect(originalCard.totalQuantity).toBe(originalQuantity);
                
                const mockInput = { value: newQuantity.toString() };
                testEnv.updateCardQuantity(mockInput, cardId);
                
                const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === cleanId);
                expect(updatedCard.totalQuantity).toBe(newQuantity);
            });
        });
    });
});

// Simple test runner if Jest is not available
if (typeof describe === 'undefined') {
    console.log('Running basic tests without Jest...');
    
    // Basic test implementation
    let testCount = 0;
    let passCount = 0;
    
    global.describe = (name, fn) => {
        console.log(`\n=== ${name} ===`);
        fn();
    };
    
    global.test = (name, fn) => {
        testCount++;
        try {
            fn();
            console.log(`✅ ${name}`);
            passCount++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
        }
    };
    
    global.expect = (actual) => ({
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error('Expected value to be truthy');
            }
        },
        not: {
            toThrow: () => {
                try {
                    actual();
                } catch (error) {
                    throw new Error(`Expected function not to throw, but it threw: ${error.message}`);
                }
            }
        }
    });
    
    global.beforeEach = (fn) => {
        // Simple beforeEach - would need more sophisticated implementation for real use
        fn();
    };
    
    // Run the tests
    try {
        eval(fs.readFileSync(__filename, 'utf8'));
        console.log(`\n=== Test Results ===`);
        console.log(`${passCount}/${testCount} tests passed`);
    } catch (error) {
        console.error('Error running tests:', error);
    }
}
