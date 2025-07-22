/**
 * API Module - Handles all API interactions with Scryfall
 */

const API = {
    /**
     * Search for cards by name
     * @param {string} cardName - The name of the card to search for
     * @returns {Promise} - Promise that resolves to the search results
     */
    searchCards: async function(cardName) {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&unique=prints`, {
                headers: {
                    'User-Agent': 'TCGCardManager/1.0 (https://github.com/DarylSchroeder/TCGCardManager)'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error searching for cards:', error);
            throw error;
        }
    },

    /**
     * Get bulk data information from Scryfall
     * @returns {Promise} - Promise that resolves to the bulk data information
     */
    getBulkData: async function() {
        try {
            const response = await fetch('https://api.scryfall.com/bulk-data', {
                headers: {
                    'User-Agent': 'TCGCardManager/1.0 (https://github.com/DarylSchroeder/TCGCardManager)'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching bulk data info:', error);
            throw error;
        }
    },

    /**
     * Get unique artwork data
     * @returns {Promise} - Promise that resolves to the unique artwork data
     */
    getUniqueArtwork: async function() {
        try {
            // First get the bulk data info to find the download URI
            const bulkData = await this.getBulkData();
            
            // Find the unique artwork data
            const uniqueArtworkData = bulkData.data.find(item => item.type === 'unique_artwork');
            
            if (!uniqueArtworkData) {
                throw new Error('Unique artwork data not found');
            }
            
            // Get the download URI
            const downloadUri = uniqueArtworkData.download_uri;
            
            // Fetch the actual data
            console.log(`Fetching unique artwork data from ${downloadUri}...`);
            const response = await fetch(downloadUri, {
                headers: {
                    'User-Agent': 'TCGCardManager/1.0 (https://github.com/DarylSchroeder/TCGCardManager)'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching unique artwork data:', error);
            throw error;
        }
    }
};

// Export the API object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
