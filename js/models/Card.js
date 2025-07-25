/**
 * Card Model - Represents a trading card with all its properties
 */
class Card {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.set = data.set || '';
        this.setName = data.setName || '';
        this.collectorNumber = data.collectorNumber || '';
        this.imageUrl = data.imageUrl || '';
        this.prices = data.prices || {};
        
        // Validation
        this.validate();
    }
    
    validate() {
        if (!this.name) {
            throw new Error('Card name is required');
        }
    }
    
    getDisplayName() {
        return `${this.name} (${this.setName})`;
    }
    
    getMarketPrice() {
        return this.prices?.usd ? parseFloat(this.prices.usd) : 0;
    }
    
    hasImage() {
        return this.imageUrl && this.imageUrl !== '';
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            set: this.set,
            setName: this.setName,
            collectorNumber: this.collectorNumber,
            imageUrl: this.imageUrl,
            prices: this.prices
        };
    }
    
    static fromScryfallData(scryfallCard) {
        const imageUrl = scryfallCard.image_uris?.normal || 
                        (scryfallCard.card_faces && scryfallCard.card_faces[0].image_uris?.normal) || 
                        '';
        
        return new Card({
            id: scryfallCard.id,
            name: scryfallCard.name,
            set: scryfallCard.set,
            setName: scryfallCard.set_name,
            collectorNumber: scryfallCard.collector_number,
            imageUrl: imageUrl,
            prices: scryfallCard.prices || {}
        });
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card;
} else {
    window.Card = Card;
}
