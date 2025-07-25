# TCG Card Manager

A comprehensive web application for managing your trading card game collection with advanced pricing tools and inventory management.

## Features

### Core Functionality
- **Card Search**: Search for cards using the Scryfall API with auto-search on Enter
- **Card Details**: View high-quality card images and comprehensive information
- **Inventory Management**: Add cards with quantity, condition, and price tracking
- **CSV Export/Import**: Export inventory and import price lists
- **Pricing Tool**: Advanced TCG pricing calculator with market-based rules

### Advanced Features
- **Price List Integration**: Upload and manage custom price lists with localStorage caching
- **Two-Column Layout**: Optimized 60/40 split UI for efficient workflow
- **Smart Card Matching**: Intelligent set name mapping and fallback mechanisms
- **Real-time Updates**: Live inventory updates with quantity management
- **Error Handling**: Comprehensive error handling with user feedback
- **Performance Optimization**: Image caching and pre-fetching for faster loading

## Getting Started

### Prerequisites
- Node.js (for running the local server)

### Installation
1. Clone this repository
2. Navigate to the project directory
3. Run the server: `./run.sh`
4. Open your browser to: `http://localhost:3000`

## User Workflow

### Basic Card Management
1. **Search**: Enter card name (e.g., "Counterspell") and press Enter
2. **Select**: Click on a card in the search results to view details
3. **Add**: Enter quantity, condition, and price, then click "Add to Inventory"
4. **Export**: Click "Export to CSV" to download your inventory

### Advanced Pricing Workflow
1. **Upload Price List**: Use "Update Price List" to upload TCG pricing data
2. **Access Pricing Tool**: Click "Pricing Tool" for advanced price calculations
3. **Import Inventory**: Upload existing inventory CSV files
4. **Calculate Prices**: Apply TCG pricing rules automatically
5. **Export Results**: Download updated inventory with calculated prices

## Pricing Rules

The pricing tool follows TCG marketplace rules:
- **Minimum Price**: No card priced below $0.50
- **Standard Cards** ($0.30 - $30): max($0.50, max(TCG Low Price, average of TCG Low With Shipping and TCG Market Price))
- **Cheap Cards** (≤ $0.30): max($0.50, TCG Low Price)
- **Expensive Cards** (> $30): Keep original price

## UI Layout

### Two-Column Design
- **Left Panel (60%)**: Search results with compact thumbnail list
- **Right Panel (40%)**: Selected card details and add-to-inventory form
- **Bottom Section**: Full-width inventory table with export functionality
- **Fixed Heights**: 500px for search/details to prevent inventory from being pushed off-screen

### User Experience Enhancements
- Entire card rows are clickable for easy selection
- Visual feedback with blue borders for selected cards
- Automatic scrolling to card details when selected
- Streamlined inventory table with header-based export button

## Testing

### Run All Tests
```bash
npm test
# or
./test/run-tests.sh
```

### Test Coverage
- **Quantity Update Tests**: Validates HTML template quote handling fixes
- **Integration Tests**: Verifies CSV data handling and real file operations
- **Pricing Tests**: Validates TCG pricing rule calculations
- **Edge Case Tests**: Handles invalid inputs, missing cards, and error conditions

### Specific Test Commands
```bash
npm run test:quantity    # Test quantity update functionality
npm run test:pricing     # Test pricing calculations
npm run test:csv         # Test CSV import/export
```

## Architecture

### Current Implementation
- **Frontend**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript
- **Backend**: Node.js server with Express-like routing
- **Storage**: In-memory with localStorage for price lists
- **API**: Scryfall API integration (requires User-Agent header)

### New Modular Architecture (Available)
- **Models**: `Card.js`, `InventoryItem.js` - Data representation with validation
- **Services**: `CardSearchService.js`, `InventoryService.js` - Business logic layer
- **Controllers**: `MainController.js` - Application coordination
- **UI Layer**: `UIManager.js` - DOM manipulation and event handling

## Development

### Known Issues Fixed
- **Quantity Update Bug**: Fixed HTML template quote handling in card lookups
- **Price List Loading**: Added localStorage fallback and quota handling
- **Set Name Mapping**: Improved card matching between Scryfall and price lists
- **Layout Issues**: Fixed search results extending behind inventory panel

### Performance Optimizations
- Pre-fetch popular card images on server start (configurable)
- Cache set data (changes infrequently)
- Smaller thumbnail images for faster loading
- Graceful localStorage quota handling

### Code Quality
- Comprehensive test suite with multiple test scenarios
- Modular code structure for maintainability
- Proper error handling throughout the application
- Consistent naming conventions and code style

## Future Enhancements

### Planned Features
- Local storage persistence for inventory between sessions
- Advanced filtering and sorting options for search results
- Bulk import/export features with validation
- Collection statistics and analytics dashboard
- Keyboard navigation for search results
- Quick-add buttons in list view for frequent cards

### Technical Improvements
- Migration to class-based architecture (files ready)
- TypeScript conversion for better type safety
- IndexedDB for larger storage capacity
- Cloud storage integration options
- Advanced caching strategies

## Technologies Used

- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- **Backend**: Node.js with custom server implementation
- **APIs**: Scryfall API for card data
- **Storage**: localStorage with in-memory fallback
- **Testing**: Custom test framework with Node.js

## Contributing

When making changes:
1. Ensure all tests pass: `npm test`
2. Follow existing code style and patterns
3. Add tests for new functionality
4. Update documentation as needed
5. Test quantity update functionality specifically (known regression area)

## API Requirements

- **Scryfall API**: Requires User-Agent header in all requests
- **Rate Limiting**: Respectful API usage with proper delays
- **Error Handling**: Graceful fallbacks for API failures
