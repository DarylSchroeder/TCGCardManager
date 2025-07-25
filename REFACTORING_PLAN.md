# JavaScript Refactoring Plan

## Current State Analysis

### Issues Identified
1. **Mixed Paradigms**: Procedural code in `app.js` vs class-based code in `tcgPricing.js`
2. **Global State**: Heavy reliance on global variables (`selectedCard`, `inventory`)
3. **Tight Coupling**: Business logic mixed with DOM manipulation
4. **No Dependency Injection**: Hard to test and maintain
5. **Inconsistent Error Handling**: Different patterns across files
6. **No Separation of Concerns**: UI, business logic, and data access all mixed together

## Proposed Architecture

### 1. Models (Data Layer)
- `Card.js` - Represents a trading card
- `InventoryItem.js` - Represents a card in inventory with quantity/condition/price
- `TCGCard.js` - Enhanced card model for pricing (keep existing)

### 2. Services (Business Logic Layer)
- `CardSearchService.js` - Handles Scryfall API interactions
- `InventoryService.js` - Manages inventory operations
- `PricingService.js` - Handles card pricing logic (refactor existing)
- `ExportService.js` - Handles CSV/JSON export operations

### 3. Controllers (Application Layer)
- `MainController.js` - Coordinates between services and UI
- `PricingController.js` - Handles pricing tool functionality

### 4. UI Layer
- `UIManager.js` - Handles all DOM manipulation
- `ComponentFactory.js` - Creates reusable UI components

## Benefits of This Architecture

### For C# Developers
- **Familiar Patterns**: MVC, Dependency Injection, Service Layer
- **Class-Based**: Uses ES6 classes similar to C# classes
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Each class can be unit tested independently
- **Type Safety Ready**: Easy to migrate to TypeScript later

### Technical Benefits
- **Maintainability**: Clear structure and responsibilities
- **Reusability**: Services can be reused across different UI components
- **Error Handling**: Centralized and consistent error management
- **Event System**: Decoupled communication between components
- **Performance**: Better memory management and DOM optimization

## Migration Strategy

### Phase 1: Create New Architecture (Low Risk)
1. ✅ Create new model classes (`Card`, `InventoryItem`)
2. ✅ Create new service classes (`CardSearchService`, `InventoryService`)
3. ✅ Create controller and UI manager classes
4. ✅ Create example refactored app (`app-refactored.js`)

### Phase 2: Gradual Migration (Medium Risk)
1. Update `index.html` to use new architecture
2. Migrate existing functionality piece by piece
3. Update tests to work with new classes
4. Keep old code as fallback during transition

### Phase 3: Cleanup (Low Risk)
1. Remove old procedural code
2. Optimize and refine new architecture
3. Add comprehensive error handling
4. Performance optimization

### Phase 4: TypeScript Migration (Optional)
1. Add TypeScript configuration
2. Convert classes to TypeScript one by one
3. Add proper type definitions
4. Leverage TypeScript's advanced features

## Implementation Examples

### Before (Current)
```javascript
// Global variables scattered everywhere
let selectedCard = null;
let inventory = [];

// Mixed concerns in one function
async function searchCards() {
    const cardName = searchInput.value.trim();
    // Validation mixed with API call mixed with UI update
    if (!cardName) {
        showError('Please enter a card name to search.');
        return;
    }
    showLoading(true);
    // ... API call and DOM manipulation all in one place
}
```

### After (Refactored)
```javascript
// Clear separation of concerns
class MainController {
    async handleCardSearch(cardName) {
        try {
            this.setLoading(true);
            
            // Service handles validation and API
            const cards = await this.cardSearchService.searchCards(cardName);
            
            // UI Manager handles display
            this.uiManager.displaySearchResults(cards, (card) => this.handleCardSelection(card));
            
        } catch (error) {
            this.uiManager.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }
}
```

## Testing Strategy

### Unit Tests
- Each service class can be tested independently
- Mock dependencies for isolated testing
- Test business logic without DOM dependencies

### Integration Tests
- Test controller coordination between services
- Test UI manager DOM manipulation
- Test complete user workflows

### Example Test Structure
```javascript
describe('CardSearchService', () => {
    let service;
    
    beforeEach(() => {
        service = new CardSearchService();
    });
    
    test('should validate search queries', () => {
        expect(service.isValidSearchQuery('')).toBe(false);
        expect(service.isValidSearchQuery('Lightning Bolt')).toBe(true);
    });
    
    test('should handle API errors gracefully', async () => {
        // Mock fetch to return error
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        
        await expect(service.searchCards('test')).rejects.toThrow('Failed to search for cards');
    });
});
```

## File Structure

```
js/
├── models/
│   ├── Card.js
│   ├── InventoryItem.js
│   └── TCGCard.js (existing, enhanced)
├── services/
│   ├── CardSearchService.js
│   ├── InventoryService.js
│   ├── PricingService.js
│   └── ExportService.js
├── controllers/
│   ├── MainController.js
│   └── PricingController.js
├── ui/
│   ├── UIManager.js
│   └── ComponentFactory.js
├── utils/
│   ├── EventEmitter.js
│   └── Validators.js
└── app.js (new main entry point)
```

## Next Steps

1. **Review the proposed architecture** - Does this feel familiar and maintainable?
2. **Choose migration approach** - Gradual migration vs clean rewrite
3. **Decide on TypeScript timeline** - Now or after JS refactor?
4. **Update build process** - Consider adding bundling/minification
5. **Plan testing strategy** - Unit tests, integration tests, E2E tests

## TypeScript Considerations

### When to Migrate
- **After JS Refactor**: Safer, allows you to validate architecture first
- **During Refactor**: More work upfront but better long-term benefits
- **Immediate**: If you're comfortable with TS learning curve

### TypeScript Benefits for C# Developers
- **Strong Typing**: Similar to C# type system
- **Interfaces**: Define contracts like C# interfaces
- **Generics**: Type-safe collections and methods
- **IntelliSense**: Better IDE support and autocomplete
- **Compile-time Errors**: Catch errors before runtime

### Example TypeScript Interface
```typescript
interface ICardSearchService {
    searchCards(cardName: string): Promise<Card[]>;
    getCardById(cardId: string): Promise<Card>;
    isValidSearchQuery(query: string): boolean;
}

class CardSearchService implements ICardSearchService {
    // Implementation with full type safety
}
```

## Recommendation

**Start with the JavaScript refactor** to validate the architecture, then migrate to TypeScript once you're comfortable with the new structure. This approach minimizes risk while providing immediate benefits.
