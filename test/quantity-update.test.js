/**
 * Comprehensive Test Suite: Quantity Update Functionality
 * 
 * This test suite validates the fix for the quote handling bug in the 
 * updateCardQuantity function and ensures no regression occurs.
 * 
 * The bug occurred when HTML templates generated onclick handlers like:
 * onclick="updateCardQuantity(this, '8728925')"
 * 
 * The function was not properly handling the quoted card IDs, causing
 * card lookups to fail and quantity updates to not persist.
 */

const fs = require('fs');
const path = require('path');
const TestDataLoader = require('./test-data-loader');

// Initialize test data loader
const testDataLoader = new TestDataLoader();

// Mock DOM elements and global functions for testing
global.document = {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    querySelector: jest.fn()
};

global.window = {
    location: { href: '' }
};

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

describe('Quantity Update Functionality', () => {
    let testEnv;
    
    beforeEach(() => {
        // Create test environment using CSV data
        testEnv = testDataLoader.createTestEnvironment();
        
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
    });
    
    describe('Card ID Quote Handling', () => {
        test('should handle card ID with single quotes (HTML template case)', () => {
            const mockInput = { value: '5' };
            testEnv.updateCardQuantity(mockInput, "'8728925'");
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card).toBeDefined();
            expect(card.totalQuantity).toBe(5);
        });
        
        test('should handle card ID with double quotes', () => {
            const mockInput = { value: '3' };
            testEnv.updateCardQuantity(mockInput, '"5400291"');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '5400291');
            expect(card).toBeDefined();
            expect(card.totalQuantity).toBe(3);
        });
        
        test('should handle card ID without quotes', () => {
            const mockInput = { value: '225' };
            testEnv.updateCardQuantity(mockInput, '8755665');
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8755665');
            expect(card).toBeDefined();
            expect(card.totalQuantity).toBe(225);
        });
        
        test('should handle mixed quotes gracefully', () => {
            const mockInput = { value: '10' };
            testEnv.updateCardQuantity(mockInput, "'8728925\"");
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card).toBeDefined();
            expect(card.totalQuantity).toBe(10);
        });
    });
    
    describe('Original Failing Cases (from CSV data)', () => {
        testDataLoader.getOriginalFailingCases().forEach(({ cardId, newQuantity, originalQuantity, description }) => {
            test(`should handle: ${description}`, () => {
                const cleanId = cardId.replace(/^['"]|['"]$/g, '');
                const originalCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === cleanId);
                expect(originalCard.totalQuantity).toBe(originalQuantity);
                
                const mockInput = { value: newQuantity.toString() };
                testEnv.updateCardQuantity(mockInput, cardId);
                
                expect(originalCard.totalQuantity).toBe(newQuantity);
            });
        });
    });
    
    describe('Edge Cases', () => {
        test('should handle zero quantity', () => {
            const mockInput = { value: '0' };
            testEnv.updateCardQuantity(mockInput, "'8728925'");
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card.totalQuantity).toBe(0);
        });
        
        test('should handle invalid input gracefully', () => {
            const mockInput = { value: 'invalid' };
            testEnv.updateCardQuantity(mockInput, "'8728925'");
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card.totalQuantity).toBe(0); // Should convert to 0
        });
        
        test('should handle non-existent card ID', () => {
            const mockInput = { value: '5' };
            
            // Should not throw an error
            expect(() => {
                testEnv.updateCardQuantity(mockInput, "'nonexistent'");
            }).not.toThrow();
        });
        
        test('should handle negative quantities', () => {
            const mockInput = { value: '-5' };
            testEnv.updateCardQuantity(mockInput, "'8728925'");
            
            const card = testEnv.pricingService.cards.find(c => c.tcgplayerId === '8728925');
            expect(card.totalQuantity).toBe(-5);
        });
    });
    
    describe('Integration Tests', () => {
        test('should work with all test cards from CSV', () => {
            const testCards = testDataLoader.getMainTestCards();
            
            testCards.forEach((expectedCard, index) => {
                const newQuantity = (index + 1) * 10; // 10, 20, 30, etc.
                const mockInput = { value: newQuantity.toString() };
                
                testEnv.updateCardQuantity(mockInput, `'${expectedCard.tcgplayerId}'`);
                
                const actualCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === expectedCard.tcgplayerId);
                expect(actualCard.totalQuantity).toBe(newQuantity);
                expect(actualCard.productName).toBe(expectedCard.productName);
            });
        });
        
        test('should simulate real HTML template behavior', () => {
            // Simulate what happens when the HTML template generates the onclick handler
            const testCards = testDataLoader.getMainTestCards();
            const card = testCards[0]; // A Promise Fulfilled
            const generatedOnClick = `updateCardQuantity(this, '${card.tcgplayerId}')`;
            
            // Extract the card ID from the generated onclick (simulating browser behavior)
            const cardIdMatch = generatedOnClick.match(/updateCardQuantity\(this, '([^']+)'\)/);
            expect(cardIdMatch).toBeTruthy();
            
            const extractedCardId = `'${cardIdMatch[1]}'`; // Re-add quotes as they would appear
            const mockInput = { value: '99' };
            
            testEnv.updateCardQuantity(mockInput, extractedCardId);
            
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === card.tcgplayerId);
            expect(updatedCard.totalQuantity).toBe(99);
        });
    });
    
    describe('Data Consistency', () => {
        test('should maintain card data integrity during updates', () => {
            const originalCard = testDataLoader.getMainTestCards()[0];
            const mockInput = { value: '42' };
            
            testEnv.updateCardQuantity(mockInput, `'${originalCard.tcgplayerId}'`);
            
            const updatedCard = testEnv.pricingService.cards.find(c => c.tcgplayerId === originalCard.tcgplayerId);
            
            // Quantity should change
            expect(updatedCard.totalQuantity).toBe(42);
            
            // Other properties should remain unchanged
            expect(updatedCard.productName).toBe(originalCard.productName);
            expect(updatedCard.setName).toBe(originalCard.setName);
            expect(updatedCard.condition).toBe(originalCard.condition);
        });
    });
});
