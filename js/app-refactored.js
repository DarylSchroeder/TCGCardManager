/**
 * Main Application Entry Point - Refactored Version
 * 
 * This demonstrates the new class-based architecture that follows
 * familiar C# patterns like dependency injection and separation of concerns.
 */

/**
 * UIManager - Handles all DOM manipulation and UI updates
 * Separated from business logic for better testability
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.controller = null;
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initialize() {
        this.cacheElements();
        this.bindEvents();
        this.setupInitialState();
    }
    
    /**
     * Set the controller (dependency injection)
     */
    setController(controller) {
        this.controller = controller;
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('search-input'),
            searchButton: document.getElementById('search-button'),
            searchResults: document.getElementById('search-results'),
            loadingIndicator: document.getElementById('loading'),
            errorMessage: document.getElementById('error-message'),
            cardDetailsContainer: document.getElementById('card-details-container'),
            selectedCardImage: document.getElementById('selected-card-image'),
            selectedCardName: document.getElementById('selected-card-name'),
            selectedCardSet: document.getElementById('selected-card-set'),
            quantityInput: document.getElementById('quantity'),
            conditionSelect: document.getElementById('condition'),
            priceInput: document.getElementById('price'),
            addToInventoryButton: document.getElementById('add-to-inventory'),
            inventoryBody: document.getElementById('inventory-body'),
            exportCsvButton: document.getElementById('export-csv')
        };
        
        // Validate all required elements exist
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`Element not found: ${key}`);
            }
        });
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search events
        this.elements.searchButton?.addEventListener('click', () => {
            this.handleSearch();
        });
        
        this.elements.searchInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.handleSearch();
            }
        });
        
        // Inventory events
        this.elements.addToInventoryButton?.addEventListener('click', () => {
            this.handleAddToInventory();
        });
        
        this.elements.exportCsvButton?.addEventListener('click', () => {
            this.controller?.handleExportCSV();
        });
    }
    
    /**
     * Setup initial UI state
     */
    setupInitialState() {
        this.hideError();
        this.setLoading(false);
        this.elements.cardDetailsContainer.style.display = 'none';
    }
    
    /**
     * Handle search button click
     */
    handleSearch() {
        const cardName = this.elements.searchInput?.value?.trim();
        if (cardName && this.controller) {
            this.controller.handleCardSearch(cardName);
        }
    }
    
    /**
     * Handle add to inventory button click
     */
    handleAddToInventory() {
        if (!this.controller) return;
        
        const inventoryData = {
            quantity: parseInt(this.elements.quantityInput?.value) || 1,
            condition: this.elements.conditionSelect?.value || 'Near Mint',
            price: parseFloat(this.elements.priceInput?.value) || 0
        };
        
        this.controller.handleAddToInventory(inventoryData);
    }
    
    /**
     * Display search results
     */
    displaySearchResults(cards, onCardSelect) {
        if (!this.elements.searchResults) return;
        
        this.elements.searchResults.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = this.createCardElement(card, onCardSelect);
            this.elements.searchResults.appendChild(cardElement);
        });
    }
    
    /**
     * Create a card element for search results
     */
    createCardElement(card, onCardSelect) {
        const cardElement = document.createElement('div');
        cardElement.className = 'search-result-item';
        cardElement.innerHTML = `
            <div class="card-thumbnail">
                <img src="${card.imageUrl || 'https://via.placeholder.com/60x84?text=No+Image'}" 
                     alt="${card.name}" class="card-thumb-image">
            </div>
            <div class="card-info">
                <h6 class="card-name">${card.name}</h6>
                <p class="card-set">${card.setName} (${card.set}) #${card.collectorNumber}</p>
            </div>
        `;
        
        cardElement.addEventListener('click', () => {
            // Remove selection from other cards
            document.querySelectorAll('.search-result-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selection to this card
            cardElement.classList.add('selected');
            
            // Call the selection handler
            onCardSelect(card);
        });
        
        return cardElement;
    }
    
    /**
     * Display selected card details
     */
    displaySelectedCard(card) {
        if (!this.elements.selectedCardImage || !this.elements.selectedCardName || !this.elements.selectedCardSet) {
            return;
        }
        
        this.elements.selectedCardImage.src = card.imageUrl || 'https://via.placeholder.com/265x370?text=No+Image';
        this.elements.selectedCardName.textContent = card.name;
        this.elements.selectedCardSet.textContent = `${card.setName} (${card.set}) #${card.collectorNumber}`;
        
        // Set market price if available
        const marketPrice = card.getMarketPrice();
        if (marketPrice > 0 && this.elements.priceInput) {
            this.elements.priceInput.value = marketPrice.toFixed(2);
        }
        
        this.elements.cardDetailsContainer.style.display = 'block';
    }
    
    /**
     * Update inventory display
     */
    updateInventoryDisplay(items) {
        if (!this.elements.inventoryBody) return;
        
        this.elements.inventoryBody.innerHTML = '';
        
        items.forEach((item, index) => {
            const row = this.createInventoryRow(item, index);
            this.elements.inventoryBody.appendChild(row);
        });
    }
    
    /**
     * Create inventory table row
     */
    createInventoryRow(item, index) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.card.name}</td>
            <td>${item.card.setName} (${item.card.set})</td>
            <td>${item.quantity}</td>
            <td>${item.condition}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">Remove</button>
            </td>
        `;
        
        const removeButton = row.querySelector('.remove-btn');
        removeButton?.addEventListener('click', () => {
            this.controller?.handleRemoveFromInventory(index);
        });
        
        return row;
    }
    
    /**
     * Reset inventory form
     */
    resetInventoryForm() {
        if (this.elements.quantityInput) this.elements.quantityInput.value = '1';
        if (this.elements.conditionSelect) this.elements.conditionSelect.value = 'Near Mint';
        if (this.elements.priceInput) this.elements.priceInput.value = '';
    }
    
    /**
     * Show/hide loading indicator
     */
    setLoading(isLoading) {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            this.elements.errorMessage.className = 'alert alert-danger';
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            this.elements.errorMessage.className = 'alert alert-success';
            
            // Auto-hide success messages
            setTimeout(() => this.hideError(), 3000);
        }
    }
    
    /**
     * Show info message
     */
    showInfo(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            this.elements.errorMessage.className = 'alert alert-info';
            
            // Auto-hide info messages
            setTimeout(() => this.hideError(), 3000);
        }
    }
    
    /**
     * Hide error/message display
     */
    hideError() {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }
    
    /**
     * Clear search results
     */
    clearSearchResults() {
        if (this.elements.searchResults) {
            this.elements.searchResults.innerHTML = '';
        }
    }
    
    /**
     * Scroll to card details section
     */
    scrollToCardDetails() {
        if (this.elements.cardDetailsContainer) {
            this.elements.cardDetailsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
    
    /**
     * Clear all UI state
     */
    clearAll() {
        this.clearSearchResults();
        this.hideError();
        this.resetInventoryForm();
        this.updateInventoryDisplay([]);
        if (this.elements.cardDetailsContainer) {
            this.elements.cardDetailsContainer.style.display = 'none';
        }
    }
}

/**
 * Application Bootstrap
 * This is where everything gets wired together
 */
class Application {
    constructor() {
        this.controller = null;
        this.uiManager = null;
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Create instances
            this.controller = new MainController();
            this.uiManager = new UIManager();
            
            // Wire them together (dependency injection)
            this.uiManager.setController(this.controller);
            this.controller.initialize(this.uiManager);
            
            console.log('TCG Card Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new Application();
    await app.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Application, UIManager };
} else {
    window.Application = Application;
    window.UIManager = UIManager;
}
