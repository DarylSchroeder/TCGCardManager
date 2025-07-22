const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
    '.ico': 'image/x-icon'
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
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
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
        
        // Find the unique artwork data
        const uniqueArtworkData = bulkData.data.find(item => item.type === 'unique_artwork');
        
        if (!uniqueArtworkData) {
            throw new Error('Unique artwork data not found');
        }
        
        // Get the download URI
        const downloadUri = uniqueArtworkData.download_uri;
        
        console.log(`Fetching unique artwork data from ${downloadUri}...`);
        console.log('This may take a while due to the large file size...');
        
        // Fetch the actual data
        const uniqueArtwork = await fetchJson(downloadUri);
        
        console.log(`Received ${uniqueArtwork.length} cards with unique artwork`);
        
        // Store image URLs in the cache
        uniqueArtwork.forEach(card => {
            if (card.image_uris?.normal) {
                imageCache[card.id] = card.image_uris.normal;
            } else if (card.card_faces && card.card_faces[0].image_uris?.normal) {
                imageCache[card.id] = card.card_faces[0].image_uris.normal;
            }
        });
        
        console.log(`Cached ${Object.keys(imageCache).length} card images`);
        
        // Create a file to store the image cache
        fs.writeFileSync(
            path.join(__dirname, 'js', 'imageCache.js'), 
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
    
    // Pre-fetch card images when the server starts
    console.log('Pre-fetching card images...');
    prefetchCardImages();
});
