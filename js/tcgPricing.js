/**
 * TCG Card Pricing Module
 * 
 * This module handles the pricing logic for TCG cards based on rules from the tcgplayer_pricing_app:
 * - No card can be priced less than $0.50
 * - Standard cards are priced as max($0.50, max(TCG Low Price, average of TCG Low With Shipping and TCG Market Price))
 * - Cheap cards (market price <= $0.30) are priced as max($0.50, TCG Low Price)
 * - Expensive cards (market price > $30) keep their original price
 */

class TCGCard {
    constructor(data = {}) {
        // Basic card info
        this.tcgplayerId = data.tcgplayerId || '';
        this.productLine = data.productLine || '';
        this.setName = data.setName || '';
        this.productName = data.productName || '';
        this.title = data.title || '';
        this.number = data.number || '';
        this.rarity = data.rarity || '';
        this.condition = data.condition || '';
        
        // Pricing info
        this.tcgMarketPrice = parseFloat(data.tcgMarketPrice) || 0;
        this.tcgDirectLow = parseFloat(data.tcgDirectLow) || 0;
        this.tcgLowWithShipping = parseFloat(data.tcgLowWithShipping) || 0;
        this.tcgLowPrice = parseFloat(data.tcgLowPrice) || 0;
        this.tcgMarketplacePrice = parseFloat(data.tcgMarketplacePrice) || 0;
        
        // Inventory info
        this.totalQuantity = parseInt(data.totalQuantity) || 0;
        this.addToQuantity = parseInt(data.addToQuantity) || 0;
        
        // Additional info
        this.photoUrl = data.photoUrl || '';
        
        // Calculated price (will be set by pricing strategy)
        this.estimatedPrice = null;
    }
    
    get isExpensive() {
        return this.tcgMarketPrice > 30 || this.tcgMarketplacePrice > 30;
    }
    
    get isCheap() {
        return this.tcgMarketPrice <= 0.30;
    }
    
    get isStandard() {
        return this.tcgMarketPrice > 0.30 && this.tcgMarketPrice <= 30;
    }
    
    calculatePrice() {
        const MINIMUM_PRICE = 0.50;
        
        if (this.isExpensive) {
            // Expensive cards keep their original price
            this.estimatedPrice = this.tcgMarketplacePrice;
        } else if (this.isCheap) {
            // Cheap cards: max($0.50, TCG Low Price)
            this.estimatedPrice = Math.max(MINIMUM_PRICE, this.tcgLowPrice);
        } else {
            // Standard cards: max($0.50, max(TCG Low Price, average of TCG Low With Shipping and TCG Market Price))
            const average = (this.tcgLowWithShipping + this.tcgMarketPrice) / 2;
            this.estimatedPrice = Math.max(MINIMUM_PRICE, Math.max(this.tcgLowPrice, average));
        }
        
        // Round to 2 decimal places
        this.estimatedPrice = Math.round(this.estimatedPrice * 100) / 100;
        
        return this.estimatedPrice;
    }
    
    toCSVRow(headers) {
        const values = {};
        
        headers.forEach(header => {
            switch (header) {
                case 'TCGplayer Id':
                    values[header] = `"${this.tcgplayerId}"`;
                    break;
                case 'Product Line':
                    values[header] = `"${this.productLine}"`;
                    break;
                case 'Set Name':
                    values[header] = `"${this.setName}"`;
                    break;
                case 'Product Name':
                    values[header] = `"${this.productName.replace(/"/g, '""')}"`;
                    break;
                case 'Title':
                    values[header] = `"${this.title}"`;
                    break;
                case 'Number':
                    values[header] = `"${this.number}"`;
                    break;
                case 'Rarity':
                    values[header] = `"${this.rarity}"`;
                    break;
                case 'Condition':
                    values[header] = `"${this.condition}"`;
                    break;
                case 'TCG Market Price':
                    values[header] = `"${this.tcgMarketPrice}"`;
                    break;
                case 'TCG Direct Low':
                    values[header] = `"${this.tcgDirectLow}"`;
                    break;
                case 'TCG Low Price With Shipping':
                    values[header] = `"${this.tcgLowWithShipping}"`;
                    break;
                case 'TCG Low Price':
                    values[header] = `"${this.tcgLowPrice}"`;
                    break;
                case 'Total Quantity':
                    values[header] = `"${this.totalQuantity}"`;
                    break;
                case 'Add to Quantity':
                    values[header] = `"${this.addToQuantity}"`;
                    break;
                case 'TCG Marketplace Price':
                    // Replace with estimated price if available
                    values[header] = `"${this.estimatedPrice !== null ? this.estimatedPrice : this.tcgMarketplacePrice}"`;
                    break;
                case 'Photo URL':
                    values[header] = `"${this.photoUrl}"`;
                    break;
                default:
                    values[header] = '""';
                    break;
            }
        });
        
        return headers.map(header => values[header] || '""').join(',');
    }
}

class CSVParser {
    static parseLine(line) {
        const result = [];
        let field = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // Check if this is an escaped quote (double quote)
                if (i + 1 < line.length && line[i + 1] === '"') {
                    field += '"';
                    i++; // Skip the next quote
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(field);
                field = '';
            } else {
                field += char;
            }
        }
        
        // Add the last field
        result.push(field);
        
        return result;
    }
    
    static parseCSV(csvText) {
        const lines = csvText.split(/\r?\n/);
        if (lines.length === 0) return { headers: [], cards: [] };
        
        const headers = this.parseLine(lines[0]);
        const cards = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            try {
                const row = this.parseLine(lines[i]);
                if (row.length !== headers.length) {
                    console.warn(`Skipping row ${i+1}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
                    continue;
                }
                
                const cardData = {};
                headers.forEach((header, index) => {
                    // Remove quotes if present
                    let value = row[index];
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1).replace(/""/g, '"');
                    }
                    cardData[this.normalizeHeaderName(header)] = value;
                });
                
                const card = new TCGCard(cardData);
                if (card.totalQuantity > 0) {
                    cards.push(card);
                }
            } catch (error) {
                console.error(`Error processing row ${i+1}:`, error);
            }
        }
        
        return { headers, cards };
    }
    
    static normalizeHeaderName(header) {
        // Convert CSV header names to camelCase property names
        const headerMap = {
            'TCGplayer Id': 'tcgplayerId',
            'Product Line': 'productLine',
            'Set Name': 'setName',
            'Product Name': 'productName',
            'Title': 'title',
            'Number': 'number',
            'Rarity': 'rarity',
            'Condition': 'condition',
            'TCG Market Price': 'tcgMarketPrice',
            'TCG Direct Low': 'tcgDirectLow',
            'TCG Low Price With Shipping': 'tcgLowWithShipping',
            'TCG Low Price': 'tcgLowPrice',
            'Total Quantity': 'totalQuantity',
            'Add to Quantity': 'addToQuantity',
            'TCG Marketplace Price': 'tcgMarketplacePrice',
            'Photo URL': 'photoUrl'
        };
        
        return headerMap[header] || header.toLowerCase();
    }
    
    static generateCSV(headers, cards) {
        const lines = [headers.join(',')];
        
        cards.forEach(card => {
            lines.push(card.toCSVRow(headers));
        });
        
        return lines.join('\n');
    }
}

class TCGPricingService {
    constructor() {
        this.cards = [];
        this.headers = [];
    }
    
    loadFromCSV(csvText) {
        const result = CSVParser.parseCSV(csvText);
        this.headers = result.headers;
        this.cards = result.cards;
        return this.cards.length;
    }
    
    calculatePrices() {
        this.cards.forEach(card => card.calculatePrice());
        return this.cards;
    }
    
    exportToCSV() {
        return CSVParser.generateCSV(this.headers, this.cards);
    }
    
    getCardCount() {
        return this.cards.length;
    }
    
    getTotalValue() {
        return this.cards.reduce((total, card) => {
            const price = card.estimatedPrice !== null ? card.estimatedPrice : card.tcgMarketplacePrice;
            return total + (price * card.totalQuantity);
        }, 0);
    }
}

// Export the classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TCGCard,
        CSVParser,
        TCGPricingService
    };
} else {
    // For browser use
    window.TCGCard = TCGCard;
    window.CSVParser = CSVParser;
    window.TCGPricingService = TCGPricingService;
}
