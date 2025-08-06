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
1. **Import Inventory**: Upload existing inventory CSV files with TCG pricing data
2. **Update Prices**: Click "Update Prices" to apply TCG pricing rules to your inventory
3. **Export Results**: Download updated inventory with calculated prices

## Pricing Rules

The pricing tool follows TCG marketplace rules with competitive weighting:
- **Minimum Price**: No card priced below $0.50
- **Standard Cards** ($0.30 - $30): max($0.50, avg(TCG Low Price, TCG Low Price with Shipping), Market Price)
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

### Primary Test Command (Use This!)
```bash
npm test
```
This runs the complete official test suite and is what you should use when someone says "run the tests".

### Alternative Commands
```bash
./test/run-tests.sh      # Same as npm test
```

### Individual Test Files (for debugging)
```bash
node test/csv.test.js                    # CSV parsing/export functionality
node test/pricing.test.js                # TCG pricing rule calculations
node test/integration.test.js            # Import/export integration
node test/pricing-integration.test.js    # Full pricing workflow
```

### Test Coverage
- **CSV Tests**: Parsing, escaping, export, and round-trip functionality
- **Pricing Tests**: Validates all TCG pricing rule calculations and edge cases
- **Integration Tests**: Verifies CSV data handling and real file operations
- **Pricing Integration**: Full workflow testing (import → calculate → export)

## Architecture

### Current Implementation
- **Frontend**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript
- **Backend**: Node.js server with Express-like routing
- **Storage**: In-memory with localStorage for price lists
- **API**: Scryfall API integration (requires User-Agent header)
- **Architecture**: Single-file application (`index.html`) with integrated functionality

## Development

### Known Issues Fixed
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
- Single-file architecture for simplicity and maintainability
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

## API Requirements

- **Scryfall API**: Requires User-Agent header in all requests
- **Rate Limiting**: Respectful API usage with proper delays
- **Error Handling**: Graceful fallbacks for API failures
