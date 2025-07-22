/**
 * UI Module - Handles all UI-related functionality
 */

const UI = {
    /**
     * Initialize the UI
     */
    init: function() {
        // Get DOM elements
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchResults = document.getElementById('search-results');
        this.cardDetails = document.getElementById('card-details');
        this.quantityInput = document.getElementById('quantity');
        this.conditionSelect = document.getElementById('condition');
        this.priceInput = document.getElementById('price');
        this.addToInventoryButton = document.getElementById('add-to-inventory');
        this.exportCsvButton = document.getElementById('export-csv');
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Search button click
        this.searchButton.addEventListener('click', () => {
            const cardName = this.searchInput.value.trim();
            if (cardName) {
                App.searchCards(cardName);
            }
        });
        
        // Search input enter key
        this.searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const cardName = this.searchInput.value.trim();
                if (cardName) {
                    App.searchCards(cardName);
                }
            }
        });
        
        // Add to inventory button click
        this.addToInventoryButton.addEventListener('click', () => {
            const quantity = parseInt(this.quantityInput.value);
            const condition = this.conditionSelect.value;
            const price = parseFloat(this.priceInput.value);
            
            if (isNaN(quantity) || quantity <= 0) {
                this.showError('Please enter a valid quantity.');
                return;
            }
            
            if (isNaN(price) || price < 0) {
                this.showError('Please enter a valid price.');
                return;
            }
            
            App.addToInventory(quantity, condition, price);
        });
        
        // Export CSV button click
        this.exportCsvButton.addEventListener('click', () => {
            Inventory.exportToCsv();
        });
    },
    
    /**
     * Display search results
     * @param {Array} cards - The cards to display
     */
    displaySearchResults: function(cards) {
        this.searchResults.innerHTML = '';
        
        if (cards.length === 0) {
            this.searchResults.innerHTML = '<p class="text-center">No cards found.</p>';
            return;
        }
        
        // Create the list
        const list = document.createElement('div');
        list.className = 'card-list';
        list.style.overflowY = 'auto'; // Ensure scrolling works
        
        cards.forEach(card => {
            const listItem = document.createElement('div');
            listItem.className = 'card-list-item';
            listItem.style.cursor = 'pointer';
            
            // Get the small image URL (if available) or use the normal size as fallback
            const imageUrl = card.image_uris?.small || 
                             card.image_uris?.normal || 
                             card.card_faces?.[0].image_uris?.small || 
                             card.card_faces?.[0].image_uris?.normal || 
                             'https://via.placeholder.com/146x204?text=No+Image';
            
            listItem.innerHTML = `
                <img src="${imageUrl}" class="card-thumbnail" alt="${card.name}">
                <div class="card-info">
                    <h5 class="mb-1">${card.name}</h5>
                    <p class="mb-0 text-muted">${card.set_name} (${card.set}) • ${card.rarity}</p>
                </div>
            `;
            
            // Make the entire row clickable
            listItem.addEventListener('click', () => {
                // Remove selected class from all items
                document.querySelectorAll('.card-list-item').forEach(item => {
                    item.classList.remove('selected-card');
                });
                
                // Add selected class to this item
                listItem.classList.add('selected-card');
                
                // Select the card
                App.selectCard(card);
            });
            
            list.appendChild(listItem);
        });
        
        this.searchResults.appendChild(list);
        
        // Show the number of results
        const resultsCount = document.createElement('p');
        resultsCount.className = 'mt-2 text-muted';
        resultsCount.textContent = `Found ${cards.length} card${cards.length !== 1 ? 's' : ''}`;
        this.searchResults.appendChild(resultsCount);
        
        // Force a reflow to ensure scrolling works
        this.searchResults.style.display = 'none';
        this.searchResults.offsetHeight; // Force reflow
        this.searchResults.style.display = 'block';
    },
    
    /**
     * Display card details
     * @param {Object} card - The card to display
     */
    displayCardDetails: function(card) {
        this.cardDetails.innerHTML = '';
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card mb-4';
        
        cardDiv.innerHTML = `
            <div class="row g-0">
                <div class="col-md-4">
                    <img src="${card.imageUrl}" class="img-fluid rounded-start" alt="${card.name}">
                </div>
                <div class="col-md-8">
                    <div class="card-body">
                        <h5 class="card-title">${card.name}</h5>
                        <p class="card-text">Set: ${card.setName} (${card.set})</p>
                        <p class="card-text">Collector Number: ${card.collectorNumber}</p>
                        <p class="card-text">Rarity: ${card.rarity}</p>
                        <div class="mb-3">
                            <label for="quantity" class="form-label">Quantity</label>
                            <input type="number" class="form-control" id="quantity" value="1" min="1">
                        </div>
                        <div class="mb-3">
                            <label for="condition" class="form-label">Condition</label>
                            <select class="form-select" id="condition">
                                <option value="Mint">Mint</option>
                                <option value="Near Mint" selected>Near Mint</option>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Light Played">Light Played</option>
                                <option value="Played">Played</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="price" class="form-label">Price ($)</label>
                            <input type="number" class="form-control" id="price" value="0.00" step="0.01" min="0">
                        </div>
                        <button class="btn btn-success" id="add-to-inventory">Add to Inventory</button>
                    </div>
                </div>
            </div>
        `;
        
        this.cardDetails.appendChild(cardDiv);
        
        // Re-initialize the DOM elements for the card details
        this.quantityInput = document.getElementById('quantity');
        this.conditionSelect = document.getElementById('condition');
        this.priceInput = document.getElementById('price');
        this.addToInventoryButton = document.getElementById('add-to-inventory');
        
        // Re-attach event listener
        this.addToInventoryButton.addEventListener('click', () => {
            const quantity = parseInt(this.quantityInput.value);
            const condition = this.conditionSelect.value;
            const price = parseFloat(this.priceInput.value);
            
            if (isNaN(quantity) || quantity <= 0) {
                this.showError('Please enter a valid quantity.');
                return;
            }
            
            if (isNaN(price) || price < 0) {
                this.showError('Please enter a valid price.');
                return;
            }
            
            App.addToInventory(quantity, condition, price);
        });
    },
    
    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    showError: function(message) {
        alert(message);
    },
    
    /**
     * Show a loading indicator
     * @param {string} message - The loading message to display
     */
    showLoading: function(message = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.className = 'text-center my-4';
        loadingDiv.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">${message}</p>
        `;
        
        document.body.appendChild(loadingDiv);
    },
    
    /**
     * Hide the loading indicator
     */
    hideLoading: function() {
        const loadingDiv = document.getElementById('loading-indicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
};

// Export the UI object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
