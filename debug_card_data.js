// Debug script to examine actual card data structure
const https = require('https');

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

async function testCardData() {
    try {
        console.log('Fetching card data from Scryfall API...\n');
        
        // Search for a common card
        const searchUrl = 'https://api.scryfall.com/cards/search?q=counterspell';
        const searchData = await makeRequest(searchUrl);
        
        if (searchData.data && searchData.data.length > 0) {
            const card = searchData.data[0];
            
            console.log('Examining first card data:\n');
            console.log('Card name:', JSON.stringify(card.name));
            console.log('Set name:', JSON.stringify(card.set_name));
            console.log('TCGPlayer ID:', JSON.stringify(card.tcgplayer_id));
            console.log('Collector number:', JSON.stringify(card.collector_number));
            console.log('Rarity:', JSON.stringify(card.rarity));
            
            // Check for potentially problematic fields
            const fieldsToCheck = [
                'tcgplayer_id',
                'set_name', 
                'name',
                'collector_number',
                'rarity'
            ];
            
            console.log('\nChecking for whitespace issues:');
            fieldsToCheck.forEach(field => {
                const value = card[field];
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (value !== trimmed) {
                        console.log(`⚠️  Field "${field}" has whitespace: "${value}" -> "${trimmed}"`);
                    } else if (value === '') {
                        console.log(`ℹ️  Field "${field}" is empty string`);
                    } else if (value === ' ') {
                        console.log(`⚠️  Field "${field}" is single space`);
                    } else {
                        console.log(`✓ Field "${field}" looks clean: "${value}"`);
                    }
                } else {
                    console.log(`ℹ️  Field "${field}" is ${typeof value}: ${JSON.stringify(value)}`);
                }
            });
            
            // Test the CSV escaping on actual data
            console.log('\nTesting CSV escaping on actual card data:');
            
            function escapeCSV(value) {
                if (value === null || value === undefined || value === '') {
                    return '';
                }
                const str = String(value);
                if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }
            
            const testFields = [
                card.tcgplayer_id || '',
                'Magic',
                card.set_name || '',
                card.name || '',
                '',  // Title field (always empty)
                card.collector_number || '',
                card.rarity ? card.rarity.charAt(0).toUpperCase() : ''
            ];
            
            console.log('Raw field values:');
            testFields.forEach((field, index) => {
                console.log(`  ${index}: ${JSON.stringify(field)} (${typeof field})`);
            });
            
            console.log('\nEscaped field values:');
            const escapedFields = testFields.map(escapeCSV);
            escapedFields.forEach((field, index) => {
                console.log(`  ${index}: "${field}"`);
            });
            
            console.log('\nFinal CSV row:');
            console.log(escapedFields.join(','));
            
        } else {
            console.log('No cards found in search results');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCardData();
