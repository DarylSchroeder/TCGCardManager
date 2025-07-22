/**
 * Main Application Module
 */

const App = {
    // The currently selected card
    selectedCard: null,
    
    // Cache for card images
    imageCache: {},
    
    /**
     * Initialize the application
     */
    init: function() {
        // Initialize the UI
        UI.init();
        
        console.log('TCG Card Manager initialized');
    },
    
    /**
     * Search for cards by name
     * @param {string} cardName - The name of the card to search for
     */
    searchCards: async function(cardName) {
        try {
            UI.showLoading('Searching for cards...');
            
            const data = await API.searchCards(cardName);
            
            if (data.object === 'error') {
                UI.showError(data.details);
                return;
            }
            
            UI.displaySearchResults(data.data);
        } catch (error) {
            UI.showError('Error searching for cards. Please try again.');
            console.error(error);
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Select a card to view details
     * @param {Object} card - The card to select
     */
    selectCard: function(card) {
        // Format the card data for display
        this.selectedCard = {
            id: card.id,
            name: card.name,
            set: card.set,
            setName: card.set_name,
            collectorNumber: card.collector_number,
            rarity: card.rarity,
            imageUrl: card.image_uris?.normal || card.card_faces?.[0].image_uris?.normal || 'https://via.placeholder.com/265x370?text=No+Image'
        };
        
        // Show the card details container
        const cardDetailsContainer = document.getElementById('card-details-container');
        cardDetailsContainer.style.display = 'block';
        
        // Set the card details
        document.getElementById('selected-card-image').src = this.selectedCard.imageUrl;
        document.getElementById('selected-card-name').textContent = this.selectedCard.name;
        document.getElementById('selected-card-set').textContent = `${this.selectedCard.setName} (${this.selectedCard.set}) • ${this.selectedCard.rarity}`;
        
        // No need to scroll in the two-column layout
    },
    
    /**
     * Add the selected card to the inventory
     * @param {number} quantity - The quantity to add
     * @param {string} condition - The condition of the card
     * @param {number} price - The price of the card
     */
    addToInventory: function(quantity, condition, price) {
        if (!this.selectedCard) {
            UI.showError('No card selected.');
            return;
        }
        
        Inventory.addItem(this.selectedCard, quantity, condition, price);
    },
    
    /**
     * Pre-fetch card images from the Scryfall bulk data API
     */
    prefetchCardImages: async function() {
        try {
            UI.showLoading('Pre-fetching card images. This may take a while...');
            
            console.log('Starting to pre-fetch card images...');
            const uniqueArtworkData = await API.getUniqueArtwork();
            
            console.log(`Received ${uniqueArtworkData.length} cards with unique artwork`);
            
            // Store image URLs in the cache
            uniqueArtworkData.forEach(card => {
                if (card.image_uris?.normal) {
                    this.imageCache[card.id] = card.image_uris.normal;
                } else if (card.card_faces && card.card_faces[0].image_uris?.normal) {
                    this.imageCache[card.id] = card.card_faces[0].image_uris.normal;
                }
            });
            
            console.log(`Cached ${Object.keys(this.imageCache).length} card images`);
        } catch (error) {
            console.error('Error pre-fetching card images:', error);
        } finally {
            UI.hideLoading();
        }
    }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
