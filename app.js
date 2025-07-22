// Global variables
let selectedCard = null;
let inventory = [];

// DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const cardDetailsContainer = document.getElementById('card-details-container');
const selectedCardImage = document.getElementById('selected-card-image');
const selectedCardName = document.getElementById('selected-card-name');
const selectedCardSet = document.getElementById('selected-card-set');
const quantityInput = document.getElementById('quantity');
const conditionSelect = document.getElementById('condition');
const priceInput = document.getElementById('price');
const addToInventoryButton = document.getElementById('add-to-inventory');
const inventoryBody = document.getElementById('inventory-body');
const exportCsvButton = document.getElementById('export-csv');

// Event listeners
searchButton.addEventListener('click', searchCards);
searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if within a form
        searchCards();
    }
});
addToInventoryButton.addEventListener('click', addToInventory);
exportCsvButton.addEventListener('click', exportToCsv);

// Search for cards using the Scryfall API
async function searchCards() {
    const cardName = searchInput.value.trim();
    
    if (!cardName) {
        showError('Please enter a card name to search.');
        return;
    }
    
    showLoading(true);
    hideError();
    searchResults.innerHTML = '';
    
    try {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&unique=prints`);
        const data = await response.json();
        
        if (data.object === 'error') {
            showError(data.details);
            return;
        }
        
        if (data.data && data.data.length > 0) {
            displaySearchResults(data.data);
        } else {
            showError('No cards found matching your search.');
        }
    } catch (error) {
        console.error('Error searching for cards:', error);
        showError('An error occurred while searching for cards. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display search results
function displaySearchResults(cards) {
    searchResults.innerHTML = '';
    
    cards.forEach(card => {
        const imageUrl = card.image_uris?.normal || 
                        (card.card_faces && card.card_faces[0].image_uris?.normal) || 
                        'https://via.placeholder.com/265x370?text=No+Image';
        
        const cardElement = document.createElement('div');
        cardElement.className = 'col-md-3 card-container';
        cardElement.innerHTML = `
            <div class="card h-100">
                <img src="${imageUrl}" class="card-image" alt="${card.name}">
                <div class="card-body">
                    <h5 class="card-title">${card.name}</h5>
                    <p class="card-text">${card.set_name} (${card.set}) #${card.collector_number}</p>
                    <button class="btn btn-sm btn-primary select-card-btn">Select</button>
                </div>
            </div>
        `;
        
        const selectButton = cardElement.querySelector('.select-card-btn');
        selectButton.addEventListener('click', () => selectCard(card, imageUrl));
        
        searchResults.appendChild(cardElement);
    });
}

// Select a card
function selectCard(card, imageUrl) {
    selectedCard = {
        id: card.id,
        name: card.name,
        set: card.set,
        setName: card.set_name,
        collectorNumber: card.collector_number,
        imageUrl: imageUrl
    };
    
    selectedCardImage.src = imageUrl;
    selectedCardName.textContent = card.name;
    selectedCardSet.textContent = `${card.set_name} (${card.set}) #${card.collector_number}`;
    
    // Get market price if available
    if (card.prices && card.prices.usd) {
        priceInput.value = card.prices.usd;
    } else {
        priceInput.value = '';
    }
    
    cardDetailsContainer.style.display = 'block';
}

// Add selected card to inventory
function addToInventory() {
    if (!selectedCard) {
        showError('Please select a card first.');
        return;
    }
    
    const quantity = parseInt(quantityInput.value);
    const condition = conditionSelect.value;
    const price = parseFloat(priceInput.value);
    
    if (isNaN(quantity) || quantity < 1) {
        showError('Please enter a valid quantity.');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        showError('Please enter a valid price.');
        return;
    }
    
    const inventoryItem = {
        ...selectedCard,
        quantity,
        condition,
        price
    };
    
    inventory.push(inventoryItem);
    updateInventoryTable();
    
    // Reset form
    quantityInput.value = '1';
    conditionSelect.value = 'Near Mint';
    priceInput.value = '';
}

// Update the inventory table
function updateInventoryTable() {
    inventoryBody.innerHTML = '';
    
    inventory.forEach((item, index) => {
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
        removeButton.addEventListener('click', () => removeFromInventory(index));
        
        inventoryBody.appendChild(row);
    });
}

// Remove item from inventory
function removeFromInventory(index) {
    inventory.splice(index, 1);
    updateInventoryTable();
}

// Export inventory to CSV
function exportToCsv() {
    if (inventory.length === 0) {
        showError('Your inventory is empty.');
        return;
    }
    
    const csvContent = [
        'Card Name,Set,Collector Number,Quantity,Condition,Price',
        ...inventory.map(item => `"${item.name}","${item.setName} (${item.set})","${item.collectorNumber}","${item.quantity}","${item.condition}","${item.price.toFixed(2)}"`)
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

// Helper functions
function showLoading(isLoading) {
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('TCG Card Manager initialized');
});
