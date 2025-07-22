# TCG Card Manager

A simple web application for managing your trading card game collection.

## Features

- Search for cards using the Scryfall API
- View card details and images
- Add cards to your inventory with quantity, condition, and price
- Export your inventory as a CSV file

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

## How to Use

1. **Search for Cards**: Enter a card name in the search box and click "Search"
2. **Select a Card**: Click the "Select" button on a card to view its details
3. **Add to Inventory**: Enter quantity, condition, and price, then click "Add to Inventory"
4. **Export Inventory**: Click "Export to CSV" to download your inventory as a CSV file

## Technologies Used

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla)
- Node.js (for the local server)
- Scryfall API (for card data)

## Future Enhancements

- Local storage to persist inventory between sessions
- Filtering and sorting options for search results
- More detailed card information
- Bulk import/export features
- Collection statistics and analytics
