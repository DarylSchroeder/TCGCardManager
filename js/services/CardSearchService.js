/**
 * CardSearchService - Handles card search operations via Scryfall API
 */
class CardSearchService {
    constructor() {
        this.baseUrl = 'https://api.scryfall.com';
        this.userAgent = 'TCGCardManager/1.0 (https://github.com/DarylSchroeder/TCGCardManager)';
    }
    
    /**
     * Search for cards by name
     * @param {string} cardName - The name of the card to search for
     * @returns {Promise<Card[]>} - Array of Card objects
     */
    async searchCards(cardName) {
        if (!cardName || !cardName.trim()) {
            throw new Error('Card name is required');
        }
        
        try {
            const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(cardName.trim())}&unique=prints`;
            const response = await this.makeRequest(url);
            
            if (response.object === 'error') {
                throw new Error(response.details || 'Search failed');
            }
            
            if (!response.data || response.data.length === 0) {
                return [];
            }
            
            return response.data.map(cardData => Card.fromScryfallData(cardData));
            
        } catch (error) {
            if (error.message.includes('Card name is required') || error.message.includes('Search failed')) {
                throw error;
            }
            throw new Error(`Failed to search for cards: ${error.message}`);
        }
    }
    
    /**
     * Get a specific card by ID
     * @param {string} cardId - The Scryfall ID of the card
     * @returns {Promise<Card>} - Card object
     */
    async getCardById(cardId) {
        if (!cardId) {
            throw new Error('Card ID is required');
        }
        
        try {
            const url = `${this.baseUrl}/cards/${cardId}`;
            const response = await this.makeRequest(url);
            
            if (response.object === 'error') {
                throw new Error(response.details || 'Card not found');
            }
            
            return Card.fromScryfallData(response);
            
        } catch (error) {
            throw new Error(`Failed to get card: ${error.message}`);
        }
    }
    
    /**
     * Get bulk data information
     * @returns {Promise<Object>} - Bulk data information
     */
    async getBulkData() {
        try {
            const url = `${this.baseUrl}/bulk-data`;
            return await this.makeRequest(url);
        } catch (error) {
            throw new Error(`Failed to get bulk data: ${error.message}`);
        }
    }
    
    /**
     * Make HTTP request with proper headers and error handling
     * @private
     */
    async makeRequest(url) {
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.userAgent
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Validate search query
     * @param {string} query - Search query to validate
     * @returns {boolean} - True if valid
     */
    isValidSearchQuery(query) {
        return query && 
               typeof query === 'string' && 
               query.trim().length > 0 && 
               query.trim().length <= 100; // Reasonable limit
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardSearchService;
} else {
    window.CardSearchService = CardSearchService;
}
