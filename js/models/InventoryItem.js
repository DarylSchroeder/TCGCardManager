/**
 * InventoryItem Model - Represents a card in the user's inventory
 */
class InventoryItem {
    constructor(card, quantity = 1, condition = 'Near Mint', price = 0) {
        if (!card) {
            throw new Error('Card is required for inventory item');
        }
        
        this.card = card;
        this.quantity = this.validateQuantity(quantity);
        this.condition = this.validateCondition(condition);
        this.price = this.validatePrice(price);
        this.dateAdded = new Date();
    }
    
    validateQuantity(quantity) {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            throw new Error('Quantity must be a positive integer');
        }
        return qty;
    }
    
    validateCondition(condition) {
        const validConditions = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];
        if (!validConditions.includes(condition)) {
            throw new Error(`Invalid condition: ${condition}`);
        }
        return condition;
    }
    
    validatePrice(price) {
        const p = parseFloat(price);
        if (isNaN(p) || p < 0) {
            throw new Error('Price must be a non-negative number');
        }
        return p;
    }
    
    getTotalValue() {
        return this.price * this.quantity;
    }
    
    updateQuantity(newQuantity) {
        this.quantity = this.validateQuantity(newQuantity);
    }
    
    updatePrice(newPrice) {
        this.price = this.validatePrice(newPrice);
    }
    
    updateCondition(newCondition) {
        this.condition = this.validateCondition(newCondition);
    }
    
    toCSVRow() {
        return [
            `"${this.card.name}"`,
            `"${this.card.setName} (${this.card.set})"`,
            `"${this.card.collectorNumber}"`,
            `"${this.quantity}"`,
            `"${this.condition}"`,
            `"${this.price.toFixed(2)}"`
        ].join(',');
    }
    
    toJSON() {
        return {
            card: this.card.toJSON(),
            quantity: this.quantity,
            condition: this.condition,
            price: this.price,
            dateAdded: this.dateAdded.toISOString()
        };
    }
    
    static fromJSON(data) {
        const card = new Card(data.card);
        const item = new InventoryItem(card, data.quantity, data.condition, data.price);
        item.dateAdded = new Date(data.dateAdded);
        return item;
    }
    
    static getCSVHeaders() {
        return ['Card Name', 'Set', 'Collector Number', 'Quantity', 'Condition', 'Price'];
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryItem;
} else {
    window.InventoryItem = InventoryItem;
}
