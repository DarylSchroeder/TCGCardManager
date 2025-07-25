/**
 * Test Data Loader
 * 
 * Centralized loader for test data - loads from CSV and converts to test objects
 */

const fs = require('fs');
const path = require('path');

class TestDataLoader {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this._testCards = null;
    }

    /**
     * Parse CSV content into card objects
     */
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const card = {};
            
            headers.forEach((header, index) => {
                card[header] = values[index] || '';
            });
            
            // Convert to the format our tests expect
            return {
                tcgplayerId: card['TCGplayer Id'],
                productName: card['Product Name'],
                totalQuantity: parseInt(card['Total Quantity']) || 0,
                setName: card['Set Name'],
                condition: card['Condition']
            };
        });
    }

    /**
     * Simple CSV line parser that handles quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Load test cards from CSV file
     */
    getTestCards() {
        if (!this._testCards) {
            const csvPath = path.join(this.dataDir, 'sample_inventory.csv');
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            this._testCards = this.parseCSV(csvContent);
        }
        return this._testCards;
    }

    /**
     * Get the main test cards (the ones that were originally failing)
     */
    getMainTestCards() {
        const mainCardIds = ['8728925', '5400291', '8755665'];
        return this.getTestCards().filter(card => 
            mainCardIds.includes(card.tcgplayerId)
        );
    }

    /**
     * Get additional test cards for edge cases
     */
    getAdditionalTestCards() {
        const mainCardIds = ['8728925', '5400291', '8755665'];
        return this.getTestCards().filter(card => 
            !mainCardIds.includes(card.tcgplayerId)
        );
    }

    /**
     * Get all test cards
     */
    getAllTestCards() {
        return this.getTestCards();
    }

    /**
     * Get the original failing test cases (hardcoded since they're test scenarios)
     */
    getOriginalFailingCases() {
        return [
            {
                cardId: "'8728925'",
                newQuantity: 5,
                originalQuantity: 6,
                description: "A Promise Fulfilled -1"
            },
            {
                cardId: "'5400291'",
                newQuantity: 3,
                originalQuantity: 1,
                description: "Acquisition Octopus +2"
            },
            {
                cardId: "'8755665'",
                newQuantity: 225,
                originalQuantity: 2,
                description: "Zidane +223"
            }
        ];
    }

    /**
     * Get quote handling test cases (hardcoded since they're test scenarios)
     */
    getQuoteHandlingCases() {
        return [
            {
                input: "10",
                cardId: "'8728925'",
                expectedId: "8728925",
                description: "Single quotes"
            },
            {
                input: "20",
                cardId: "\"8728925\"",
                expectedId: "8728925",
                description: "Double quotes"
            },
            {
                input: "30",
                cardId: "8728925",
                expectedId: "8728925",
                description: "No quotes"
            },
            {
                input: "40",
                cardId: "'8728925\"",
                expectedId: "8728925",
                description: "Mixed quotes"
            }
        ];
    }

    /**
     * Create a fresh test environment with mock cards
     */
    createTestEnvironment() {
        const mockCards = this.getMainTestCards().map(card => ({ ...card })); // Deep copy
        
        return {
            pricingService: { cards: mockCards },
            exportBtn: { disabled: false },
            updateStats: () => {},
            showStatus: (message, type) => {},
            console: { log: () => {}, error: () => {} }
        };
    }

    /**
     * Load sample CSV content for integration tests
     */
    getSampleCSVContent() {
        const csvPath = path.join(this.dataDir, 'sample_inventory.csv');
        return fs.readFileSync(csvPath, 'utf8');
    }

    /**
     * Get test card IDs for integration testing
     */
    getTestCardIds() {
        return this.getMainTestCards().map(card => card.tcgplayerId);
    }
}

module.exports = TestDataLoader;
