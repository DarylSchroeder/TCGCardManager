/**
 * MainController - Coordinates between services and UI components
 * This follows the MVC pattern you're familiar with from C#
 */
class MainController {
    constructor() {
        this.cardSearchService = new CardSearchService();
        this.inventoryService = new InventoryService();
        this.uiManager = null; // Will be injected
        
        this.selectedCard = null;
        this.isLoading = false;
        
        this.setupEventListeners();
    }
    
    /**
     * Initialize the controller with UI manager (dependency injection)
     * @param {UIManager} uiManager - The UI manager instance
     */
    initialize(uiManager) {
        this.uiManager = uiManager;
        this.setupInventoryEventListeners();
        this.uiManager.initialize();
    }
    
    /**
     * Setup event listeners for inventory changes
     */
    setupInventoryEventListeners() {
        this.inventoryService.on('itemAdded', (item) => {
            this.uiManager.updateInventoryDisplay(this.inventoryService.getAllItems());
            this.uiManager.showSuccess(`Added ${item.card.name} to inventory`);
        });
        
        this.inventoryService.on('itemRemoved', (item, index) => {
            this.uiManager.updateInventoryDisplay(this.inventoryService.getAllItems());
            this.uiManager.showSuccess(`Removed ${item.card.name} from inventory`);
        });
        
        this.inventoryService.on('itemUpdated', (item, oldItem, index) => {
            this.uiManager.updateInventoryDisplay(this.inventoryService.getAllItems());
        });
        
        this.inventoryService.on('inventoryCleared', () => {
            this.uiManager.updateInventoryDisplay([]);
            this.uiManager.showInfo('Inventory cleared');
        });
    }
    
    /**
     * Setup controller event listeners
     */
    setupEventListeners() {
        // These will be bound to UI events by the UIManager
    }
    
    /**
     * Handle card search request
     * @param {string} cardName - Name of card to search for
     */
    async handleCardSearch(cardName) {
        if (this.isLoading) {
            return;
        }
        
        try {
            this.setLoading(true);
            this.uiManager.clearSearchResults();
            this.uiManager.hideError();
            
            if (!this.cardSearchService.isValidSearchQuery(cardName)) {
                throw new Error('Please enter a valid card name to search.');
            }
            
            const cards = await this.cardSearchService.searchCards(cardName);
            
            if (cards.length === 0) {
                this.uiManager.showError('No cards found matching your search.');
                return;
            }
            
            this.uiManager.displaySearchResults(cards, (card) => this.handleCardSelection(card));
            
        } catch (error) {
            console.error('Search error:', error);
            this.uiManager.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Handle card selection from search results
     * @param {Card} card - The selected card
     */
    handleCardSelection(card) {
        try {
            this.selectedCard = card;
            this.uiManager.displaySelectedCard(card);
            this.uiManager.scrollToCardDetails();
        } catch (error) {
            console.error('Card selection error:', error);
            this.uiManager.showError('Failed to select card');
        }
    }
    
    /**
     * Handle adding card to inventory
     * @param {Object} inventoryData - Object containing quantity, condition, price
     */
    async handleAddToInventory(inventoryData) {
        try {
            if (!this.selectedCard) {
                throw new Error('Please select a card first.');
            }
            
            const { quantity, condition, price } = inventoryData;
            
            await this.inventoryService.addCard(
                this.selectedCard,
                quantity,
                condition,
                price
            );
            
            // Reset the form
            this.uiManager.resetInventoryForm();
            
        } catch (error) {
            console.error('Add to inventory error:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Handle removing item from inventory
     * @param {number} index - Index of item to remove
     */
    async handleRemoveFromInventory(index) {
        try {
            await this.inventoryService.removeItem(index);
        } catch (error) {
            console.error('Remove from inventory error:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Handle updating inventory item
     * @param {number} index - Index of item to update
     * @param {Object} updates - Updates to apply
     */
    async handleUpdateInventoryItem(index, updates) {
        try {
            await this.inventoryService.updateItem(index, updates);
        } catch (error) {
            console.error('Update inventory item error:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Handle CSV export
     */
    async handleExportCSV() {
        try {
            const csvContent = this.inventoryService.exportToCSV();
            this.downloadFile(csvContent, 'tcg_inventory.csv', 'text/csv');
            this.uiManager.showSuccess('Inventory exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Handle JSON export
     */
    async handleExportJSON() {
        try {
            const jsonContent = this.inventoryService.exportToJSON();
            this.downloadFile(jsonContent, 'tcg_inventory.json', 'application/json');
            this.uiManager.showSuccess('Inventory exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Get inventory statistics
     * @returns {Object} - Statistics object
     */
    getInventoryStats() {
        return {
            itemCount: this.inventoryService.getItemCount(),
            totalQuantity: this.inventoryService.getTotalQuantity(),
            totalValue: this.inventoryService.getTotalValue()
        };
    }
    
    /**
     * Set loading state
     * @private
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.uiManager.setLoading(loading);
    }
    
    /**
     * Download file helper
     * @private
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Clear all data (for testing or reset)
     */
    clearAll() {
        this.selectedCard = null;
        this.inventoryService.clear();
        this.uiManager.clearAll();
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainController;
} else {
    window.MainController = MainController;
}
