const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testAutomatedExport() {
    let browser;
    
    try {
        console.log('Starting automated export test...\n');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set up download handling
        const downloadPath = path.join(__dirname, 'tmp');
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        }
        
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });
        
        // Navigate to the application
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Wait for the page to load
        await page.waitForSelector('#search-input');
        console.log('Page loaded successfully');
        
        // Search for a card
        console.log('Searching for "Lightning Bolt"...');
        await page.type('#search-input', 'Lightning Bolt');
        await page.click('#search-button');
        
        // Wait for search results
        await page.waitForSelector('.card-item', { timeout: 10000 });
        console.log('Search results loaded');
        
        // Click on the first card
        await page.click('.card-item:first-child');
        console.log('Selected first card');
        
        // Wait for card details to load
        await page.waitForSelector('#add-to-inventory-btn');
        
        // Fill in inventory details
        await page.type('#quantity', '2');
        await page.type('#price', '1.50');
        await page.select('#condition', 'Near Mint');
        
        // Add to inventory
        await page.click('#add-to-inventory-btn');
        console.log('Added card to inventory');
        
        // Handle the alert
        page.on('dialog', async dialog => {
            console.log('Alert:', dialog.message());
            await dialog.accept();
        });
        
        // Wait a moment for the inventory to update
        await page.waitForTimeout(1000);
        
        // Search for another card
        console.log('Searching for "Counterspell"...');
        await page.evaluate(() => document.getElementById('search-input').value = '');
        await page.type('#search-input', 'Counterspell');
        await page.click('#search-button');
        
        // Wait for search results
        await page.waitForSelector('.card-item', { timeout: 10000 });
        
        // Click on the first card
        await page.click('.card-item:first-child');
        
        // Wait for card details to load
        await page.waitForSelector('#add-to-inventory-btn');
        
        // Fill in inventory details (with some empty fields)
        await page.type('#quantity', '1');
        // Leave price empty to test empty field handling
        await page.select('#condition', 'Lightly Played');
        
        // Add to inventory
        await page.click('#add-to-inventory-btn');
        console.log('Added second card to inventory');
        
        // Wait a moment
        await page.waitForTimeout(1000);
        
        // Now export the inventory
        console.log('Exporting inventory...');
        
        // Clear any existing files
        const files = fs.readdirSync(downloadPath);
        files.forEach(file => {
            if (file.endsWith('.csv')) {
                fs.unlinkSync(path.join(downloadPath, file));
            }
        });
        
        // Click export button
        await page.click('#export-button');
        
        // Wait for download to complete
        await page.waitForTimeout(3000);
        
        // Check for downloaded file
        const downloadedFiles = fs.readdirSync(downloadPath);
        const csvFile = downloadedFiles.find(file => file.endsWith('.csv'));
        
        if (csvFile) {
            const csvPath = path.join(downloadPath, csvFile);
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            
            console.log('\n=== EXPORTED CSV CONTENT ===');
            console.log(csvContent);
            console.log('=== END CSV CONTENT ===\n');
            
            // Analyze the CSV for issues
            console.log('Analyzing CSV for issues...');
            const lines = csvContent.split('\n');
            
            lines.forEach((line, index) => {
                if (line.trim() === '') return;
                
                console.log(`Line ${index + 1}: ${line}`);
                
                // Check for triple quotes pattern
                if (line.includes('""",')) {
                    console.log(`  ⚠️  FOUND TRIPLE QUOTES PATTERN: """,`);
                }
                
                // Check for quoted empty fields
                if (line.includes('""')) {
                    console.log(`  ⚠️  FOUND QUOTED EMPTY FIELD: ""`);
                }
                
                // Count consecutive commas (empty fields)
                const emptyFieldMatches = line.match(/,,+/g);
                if (emptyFieldMatches) {
                    emptyFieldMatches.forEach(match => {
                        console.log(`  ✓ Found ${match.length - 1} consecutive empty fields: ${match}`);
                    });
                }
            });
            
            // Save a copy for inspection
            const inspectionPath = path.join(__dirname, 'exported_inventory_inspection.csv');
            fs.copyFileSync(csvPath, inspectionPath);
            console.log(`\nCSV saved for inspection: ${inspectionPath}`);
            
        } else {
            console.log('❌ No CSV file was downloaded!');
            console.log('Downloaded files:', downloadedFiles);
        }
        
    } catch (error) {
        console.error('Error during automated test:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testAutomatedExport();
