// Test with real API data to see what's actually happening
const https = require('https');
const fs = require('fs');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'TCGCardManager/1.0'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Copy the exact escapeCSV function from index.html
function escapeCSV(value) {
    // Handle NULL, undefined, empty, or whitespace-only values as truly empty fields
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        return '';
    }
    
    const str = String(value).trim();  // Trim whitespace from all values
    
    // Only quote if the string contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    
    return str;
}

async function testRealApiExport() {
    try {
        console.log('Fetching real card data and testing CSV export...\n');
        
        // Search for cards that might have problematic data
        const searchQueries = ['Lightning Bolt', 'Counterspell', 'Black Lotus'];
        const inventory = [];
        
        for (const query of searchQueries) {
            console.log(`Searching for: ${query}`);
            const searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
            const searchData = await makeRequest(searchUrl);
            
            if (searchData.data && searchData.data.length > 0) {
                const card = searchData.data[0];  // Take first result
                
                // Create inventory item
                const inventoryItem = {
                    id: inventory.length + 1,
                    card: card,
                    quantity: Math.floor(Math.random() * 5) + 1,
                    condition: ['Near Mint', 'Lightly Played', 'Moderately Played'][Math.floor(Math.random() * 3)],
                    price: Math.random() * 10,
                    total: 0
                };
                inventoryItem.total = inventoryItem.quantity * inventoryItem.price;
                
                inventory.push(inventoryItem);
                console.log(`  Added: ${card.name} from ${card.set_name}`);
            }
            
            // Small delay to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\nCreated inventory with ${inventory.length} items\n`);
        
        // Now export to CSV using the exact same logic as index.html
        const headers = [
            'TCGplayer Id',
            'Product Line',
            'Set Name',
            'Product Name',
            'Title',
            'Number',
            'Rarity',
            'Condition',
            'TCG Market Price',
            'TCG Direct Low',
            'TCG Low Price With Shipping',
            'TCG Low Price',
            'Total Quantity',
            'Add to Quantity',
            'TCG Marketplace Price',
            'Photo URL'
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        inventory.forEach((item, index) => {
            console.log(`=== Processing Item ${index + 1}: ${item.card.name} ===`);
            const card = item.card;
            
            // Log the raw field values
            console.log('Raw field values:');
            console.log('  tcgplayer_id:', JSON.stringify(card.tcgplayer_id));
            console.log('  set_name:', JSON.stringify(card.set_name));
            console.log('  name:', JSON.stringify(card.name));
            console.log('  collector_number:', JSON.stringify(card.collector_number));
            console.log('  rarity:', JSON.stringify(card.rarity));
            console.log('  prices.usd:', JSON.stringify(card.prices?.usd));
            
            const row = [
                escapeCSV(card.tcgplayer_id || ''),
                escapeCSV('Magic'),
                escapeCSV(card.set_name || ''),
                escapeCSV(card.name || ''),
                escapeCSV(''),
                escapeCSV(card.collector_number || ''),
                escapeCSV(card.rarity ? card.rarity.charAt(0).toUpperCase() : ''),
                escapeCSV(item.condition || 'Near Mint'),
                escapeCSV(card.prices?.usd || '0'),
                escapeCSV('0'),
                escapeCSV(card.prices?.usd || '0'),
                escapeCSV(card.prices?.usd || '0'),
                escapeCSV(item.quantity || '1'),
                escapeCSV('0'),
                escapeCSV(item.price?.toFixed(2) || '0'),
                escapeCSV(card.image_uris?.normal || card.image_uris?.large || '')
            ];
            
            const csvRow = row.join(',');
            console.log(`CSV row: ${csvRow}\n`);
            csvContent += csvRow + '\n';
        });
        
        console.log('=== FINAL CSV CONTENT ===');
        console.log(csvContent);
        console.log('=== END CSV CONTENT ===\n');
        
        // Save to file
        fs.writeFileSync('real_api_export_test.csv', csvContent);
        console.log('CSV saved to: real_api_export_test.csv');
        
        // Analyze for the specific issue
        console.log('\nAnalyzing for triple quotes pattern:');
        const lines = csvContent.split('\n');
        
        lines.forEach((line, index) => {
            if (line.trim() === '') return;
            
            if (line.includes('""",')) {
                console.log(`Line ${index + 1}: ${line}`);
                console.log(`  ⚠️  FOUND TRIPLE QUOTES PATTERN: """,`);
                
                // Find the exact position
                const pos = line.indexOf('""",');
                const before = line.substring(Math.max(0, pos - 10), pos);
                const after = line.substring(pos, pos + 10);
                console.log(`  Context: ...${before}[""",]${after.substring(4)}...`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testRealApiExport();
