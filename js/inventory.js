/**
 * Inventory Module - Handles all inventory-related functionality
 */

const Inventory = {
    // Array to store inventory items
    items: [],
    
    /**
     * Add an item to the inventory
     * @param {Object} card - The card object
     * @param {number} quantity - The quantity to add
     * @param {string} condition - The condition of the card
     * @param {number} price - The price of the card
     */
    addItem: function(card, quantity, condition, price) {
        const item = {
            id: card.id,
            name: card.name,
            set: card.set,
            setName: card.setName,
            collectorNumber: card.collectorNumber,
            imageUrl: card.imageUrl,
            quantity: quantity,
            condition: condition,
            price: price
        };
        
        this.items.push(item);
        this.updateTable();
    },
    
    /**
     * Remove an item from the inventory
     * @param {number} index - The index of the item to remove
     */
    removeItem: function(index) {
        this.items.splice(index, 1);
        this.updateTable();
    },
    
    /**
     * Update the inventory table in the UI
     */
    updateTable: function() {
        const inventoryBody = document.getElementById('inventory-body');
        inventoryBody.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.setName} (${item.set})</td>
                <td>${item.quantity}</td>
                <td>${item.condition}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">Remove</button>
                </td>
            `;
            
            const removeButton = row.querySelector('.remove-btn');
            removeButton.addEventListener('click', () => this.removeItem(index));
            
            inventoryBody.appendChild(row);
        });
    },
    
    /**
     * Export the inventory to a CSV file
     */
    exportToCsv: function() {
        if (this.items.length === 0) {
            UI.showError('Your inventory is empty.');
            return;
        }
        
        const csvContent = [
            'Card Name,Set,Collector Number,Quantity,Condition,Price',
            ...this.items.map(item => `"${item.name}","${item.setName} (${item.set})","${item.collectorNumber}","${item.quantity}","${item.condition}","${item.price.toFixed(2)}"`)
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'tcg_inventory.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Export the Inventory object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Inventory;
}
