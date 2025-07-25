/**
 * InventoryService - Manages the user's card inventory
 */
class InventoryService {
    constructor() {
        this.items = [];
        this.eventListeners = {
            'itemAdded': [],
            'itemRemoved': [],
            'itemUpdated': [],
            'inventoryCleared': []
        };
    }
    
    /**
     * Add a card to inventory
     * @param {Card} card - The card to add
     * @param {number} quantity - Quantity to add
     * @param {string} condition - Card condition
     * @param {number} price - Card price
     * @returns {InventoryItem} - The created inventory item
     */
    addCard(card, quantity = 1, condition = 'Near Mint', price = 0) {
        try {
            const item = new InventoryItem(card, quantity, condition, price);
            this.items.push(item);
            this.emit('itemAdded', item);
            return item;
        } catch (error) {
            throw new Error(`Failed to add card to inventory: ${error.message}`);
        }
    }
    
    /**
     * Remove an item from inventory by index
     * @param {number} index - Index of item to remove
     * @returns {InventoryItem} - The removed item
     */
    removeItem(index) {
        if (index < 0 || index >= this.items.length) {
            throw new Error('Invalid inventory item index');
        }
        
        const removedItem = this.items.splice(index, 1)[0];
        this.emit('itemRemoved', removedItem, index);
        return removedItem;
    }
    
    /**
     * Update an inventory item
     * @param {number} index - Index of item to update
     * @param {Object} updates - Object with properties to update
     */
    updateItem(index, updates) {
        if (index < 0 || index >= this.items.length) {
            throw new Error('Invalid inventory item index');
        }
        
        const item = this.items[index];
        const oldItem = { ...item };
        
        try {
            if (updates.quantity !== undefined) {
                item.updateQuantity(updates.quantity);
            }
            if (updates.price !== undefined) {
                item.updatePrice(updates.price);
            }
            if (updates.condition !== undefined) {
                item.updateCondition(updates.condition);
            }
            
            this.emit('itemUpdated', item, oldItem, index);
        } catch (error) {
            throw new Error(`Failed to update inventory item: ${error.message}`);
        }
    }
    
    /**
     * Get all inventory items
     * @returns {InventoryItem[]} - Array of inventory items
     */
    getAllItems() {
        return [...this.items]; // Return a copy to prevent external modification
    }
    
    /**
     * Get inventory item by index
     * @param {number} index - Index of item to get
     * @returns {InventoryItem} - The inventory item
     */
    getItem(index) {
        if (index < 0 || index >= this.items.length) {
            throw new Error('Invalid inventory item index');
        }
        return this.items[index];
    }
    
    /**
     * Get total number of items
     * @returns {number} - Number of items in inventory
     */
    getItemCount() {
        return this.items.length;
    }
    
    /**
     * Get total value of inventory
     * @returns {number} - Total value
     */
    getTotalValue() {
        return this.items.reduce((total, item) => total + item.getTotalValue(), 0);
    }
    
    /**
     * Get total quantity of all cards
     * @returns {number} - Total quantity
     */
    getTotalQuantity() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    /**
     * Clear all inventory items
     */
    clear() {
        this.items = [];
        this.emit('inventoryCleared');
    }
    
    /**
     * Export inventory to CSV format
     * @returns {string} - CSV content
     */
    exportToCSV() {
        if (this.items.length === 0) {
            throw new Error('Inventory is empty');
        }
        
        const headers = InventoryItem.getCSVHeaders();
        const csvLines = [
            headers.join(','),
            ...this.items.map(item => item.toCSVRow())
        ];
        
        return csvLines.join('\n');
    }
    
    /**
     * Import inventory from JSON
     * @param {string} jsonData - JSON string containing inventory data
     */
    importFromJSON(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (!Array.isArray(data)) {
                throw new Error('Invalid JSON format: expected array');
            }
            
            this.clear();
            data.forEach(itemData => {
                const item = InventoryItem.fromJSON(itemData);
                this.items.push(item);
            });
            
        } catch (error) {
            throw new Error(`Failed to import inventory: ${error.message}`);
        }
    }
    
    /**
     * Export inventory to JSON
     * @returns {string} - JSON string
     */
    exportToJSON() {
        return JSON.stringify(this.items.map(item => item.toJSON()), null, 2);
    }
    
    /**
     * Find items by card name
     * @param {string} cardName - Name to search for
     * @returns {InventoryItem[]} - Matching items
     */
    findByCardName(cardName) {
        const searchTerm = cardName.toLowerCase();
        return this.items.filter(item => 
            item.card.name.toLowerCase().includes(searchTerm)
        );
    }
    
    /**
     * Event system for inventory changes
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
    
    emit(event, ...args) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryService;
} else {
    window.InventoryService = InventoryService;
}
