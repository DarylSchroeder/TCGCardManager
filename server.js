const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
    // Set to false to disable pre-fetching of card images (recommended for development)
    enablePrefetching: false,
    // Maximum number of cards to pre-fetch (to avoid memory issues)
    maxCardsToPrefetch: 1000
};

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.csv': 'text/csv'
};

// Cache for storing pre-fetched image data
const imageCache = {};

/**
 * Fetch JSON data from a URL
 * @param {string} url - The URL to fetch from
 * @returns {Promise} - Promise that resolves to the JSON data
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching data from ${url}...`);
        
        // Set up request options with a proper User-Agent
        const options = {
            headers: {
                'User-Agent': 'TCGCardManager/1.0 (https://github.com/DarylSchroeder/TCGCardManager)'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            // Log response status
            console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log(`Received ${data.length} bytes of data`);
                    
                    // For debugging, log a small sample of the response
                    if (data.length > 0) {
                        console.log(`Sample of response: ${data.substring(0, 200)}...`);
                    }
                    
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error(`Error fetching data from ${url}:`, error);
            reject(error);
        });
    });
}

/**
 * Pre-fetch card images from the Scryfall bulk data API
 */
async function prefetchCardImages() {
    try {
        console.log('Starting to pre-fetch card images...');
        
        // Get bulk data information
        const bulkData = await fetchJson('https://api.scryfall.com/bulk-data');
        
        console.log('Received bulk data:', JSON.stringify(bulkData).substring(0, 200) + '...');
        
        // Find the unique artwork data
        // Check if bulkData has the expected structure
        if (!bulkData || !bulkData.data) {
            console.error('Unexpected bulk data format:', bulkData);
            throw new Error('Bulk data does not have the expected format');
        }
        
        const uniqueArtworkData = bulkData.data.find(item => item.type === 'unique_artwork');
        
        if (!uniqueArtworkData) {
            console.error('Available bulk data types:', bulkData.data.map(item => item.type));
            throw new Error('Unique artwork data not found');
        }
        
        // Get the download URI
        const downloadUri = uniqueArtworkData.download_uri;
        
        console.log(`Fetching unique artwork data from ${downloadUri}...`);
        console.log('This may take a while due to the large file size...');
        
        // Instead of fetching all cards, let's use the Scryfall search API to get a limited number
        // This is more efficient for demonstration purposes
        console.log(`Limiting to ${CONFIG.maxCardsToPrefetch} cards for demonstration purposes`);
        
        // Use the search API to get popular cards instead of the bulk data
        const searchUrl = `https://api.scryfall.com/cards/search?q=game:paper+sort:edhrec&unique=art&order=edhrec&dir=desc`;
        const popularCards = await fetchJson(searchUrl);
        
        if (!popularCards.data || !Array.isArray(popularCards.data)) {
            throw new Error('Failed to fetch popular cards');
        }
        
        // Limit the number of cards
        const limitedCards = popularCards.data.slice(0, CONFIG.maxCardsToPrefetch);
        
        console.log(`Received ${limitedCards.length} popular cards`);
        
        // Store image URLs in the cache
        limitedCards.forEach(card => {
            if (card.image_uris?.normal) {
                imageCache[card.id] = card.image_uris.normal;
            } else if (card.card_faces && card.card_faces[0].image_uris?.normal) {
                imageCache[card.id] = card.card_faces[0].image_uris.normal;
            }
        });
        
        console.log(`Cached ${Object.keys(imageCache).length} card images`);
        
        // Ensure the js directory exists
        const jsDir = path.join(__dirname, 'js');
        if (!fs.existsSync(jsDir)) {
            fs.mkdirSync(jsDir, { recursive: true });
            console.log('Created js directory');
        }
        
        // Create a file to store the image cache
        fs.writeFileSync(
            path.join(jsDir, 'imageCache.js'), 
            `const IMAGE_CACHE = ${JSON.stringify(imageCache)};`
        );
        
        console.log('Image cache saved to imageCache.js');
    } catch (error) {
        console.error('Error pre-fetching card images:', error);
    }
}

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    // Special case for current-pricing.csv
    if (req.url === '/current-pricing.csv') {
        fs.readFile(path.join(__dirname, 'CURRENT_PRICING.csv'), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('CSV file not found');
            } else {
                res.writeHead(200, { 
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="current-pricing.csv"',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            }
        });
        return;
    }
    
    // Normalize URL
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content || '404 Not Found', 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`TCG Card Manager available at http://localhost:${PORT}/`);
    console.log(`TCG Pricing Tool available at http://localhost:${PORT}/pricing.html`);
    console.log(`TCG Card Manager available at http://localhost:${PORT}/`);
    console.log(`TCG Pricing Tool available at http://localhost:${PORT}/pricing.html`);
    
    // Pre-fetch card images when the server starts if enabled
    if (CONFIG.enablePrefetching) {
        console.log('Pre-fetching card images...');
        prefetchCardImages().catch(error => {
            console.error('Failed to pre-fetch card images:', error);
            console.log('Server will continue running without pre-fetched images');
            
            // Create an empty image cache file so the client doesn't error
            try {
                // Ensure the js directory exists
                const jsDir = path.join(__dirname, 'js');
                if (!fs.existsSync(jsDir)) {
                    fs.mkdirSync(jsDir, { recursive: true });
                    console.log('Created js directory');
                }
                
                fs.writeFileSync(
                    path.join(jsDir, 'imageCache.js'), 
                    'const IMAGE_CACHE = {};'
                );
                console.log('Created empty image cache file');
            } catch (err) {
                console.error('Failed to create empty image cache file:', err);
            }
        });
    } else {
        console.log('Pre-fetching is disabled in CONFIG');
        
        // Create an empty image cache file
        try {
            // Ensure the js directory exists
            const jsDir = path.join(__dirname, 'js');
            if (!fs.existsSync(jsDir)) {
                fs.mkdirSync(jsDir, { recursive: true });
                console.log('Created js directory');
            }
            
            fs.writeFileSync(
                path.join(jsDir, 'imageCache.js'), 
                'const IMAGE_CACHE = {};'
            );
            console.log('Created empty image cache file');
        } catch (err) {
            console.error('Failed to create empty image cache file:', err);
        }
    }
});
