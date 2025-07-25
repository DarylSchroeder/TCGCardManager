# TCG Card Manager

A simple web application for managing your trading card game collection.

## Features

- Search for cards using the Scryfall API
- View card details and images
- Add cards to your inventory with quantity, condition, and price
- Export your inventory as a CSV file
- Price calculation tool based on TCGplayer pricing rules

## Getting Started

### Prerequisites

- Node.js (for running the local server)

### Installation

1. Clone this repository
2. Navigate to the project directory

### Running the Application

1. Run the server:
   ```
   ./run.sh
   ```
   
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Testing

The application includes automated tests to ensure functionality doesn't regress:

### Run All Tests
```bash
npm test
# or
./test/run-tests.sh
```

### Run Specific Tests
```bash
# Test quantity update functionality (prevents regression of quote handling bug)
npm run test:quantity
# or
node test/quantity-update-simple.test.js
```

### Test Coverage
- **Quantity Update Tests**: Validates the fix for HTML template quote handling in card lookups
- **Integration Tests**: Verifies test data exists in real CSV files
- **Edge Case Tests**: Handles invalid inputs, missing cards, and error conditions

## How to Use

1. **Search for Cards**: Enter a card name in the search box and click "Search"
2. **Select a Card**: Click on a card in the search results to view its details
3. **Add to Inventory**: Enter quantity, condition, and price, then click "Add to Inventory"
4. **Export Inventory**: Click "Export to CSV" to download your inventory as a CSV file
5. **Pricing Tool**: Click "Pricing Tool" to access the TCG pricing calculator

## Pricing Rules

The pricing tool follows these rules:
- No card can be priced less than $0.50
- Standard cards ($0.30 - $30) are priced as max($0.50, max(TCG Low Price, average of TCG Low With Shipping and TCG Market Price))
- Cheap cards (market price <= $0.30) are priced as max($0.50, TCG Low Price)
- Expensive cards (market price > $30) keep their original price

## Technologies Used

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla)
- Node.js (for the local server)
- Scryfall API (for card data)

## Development

### Known Issues Fixed
- **Quantity Update Bug**: Fixed issue where quantity changes in the pricing tool weren't persisting to exported CSV files due to HTML template quote handling

### Contributing
When making changes to quantity update functionality, ensure tests pass:
```bash
npm test
```

## Future Enhancements

- Local storage to persist inventory between sessions
- Filtering and sorting options for search results
- More detailed card information
- Bulk import/export features
- Collection statistics and analytics
