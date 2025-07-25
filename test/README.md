# TCG Card Manager - Test Suite

A comprehensive JavaScript test suite to validate CSV import/export functionality and pricing logic.

## Test Coverage

### Unit Tests (`csv.test.js`)
- **CSV Parsing**: Tests the `parseCSVLine()` function with various edge cases
- **CSV Escaping**: Tests the `escapeCSV()` function for proper quoting and escaping
- **Inventory Export**: Tests the `formatInventoryRow()` function
- **Round-Trip**: Tests parsing → formatting → parsing with utility functions

### Integration Tests (`integration.test.js`)
- **Import Validation**: Tests real TCGplayer CSV import with all field validation
- **Export Validation**: Tests inventory export to proper CSV format
- **Full Round-Trip**: Tests import → export → re-import data integrity
- **Real Data**: Uses actual TCGplayer CSV format with complex card names

### Pricing Logic Tests (`pricing.test.js`)
- **Cheap Cards (≤ $0.30)**: Tests `max($0.50, TCG Low Price)` rule
- **Standard Cards ($0.30-$30)**: Tests `max($0.50, max(low, avg))` rule  
- **Expensive Cards (> $30)**: Tests market price preservation
- **Edge Cases**: Boundary conditions, rounding, zero values
- **Real-World Scenarios**: Common/uncommon/rare/mythic pricing patterns

### Pricing Integration Tests (`pricing-integration.test.js`)
- **Full Workflow**: Tests complete Import → Calculate Pricing → Export cycle
- **Multi-Category Validation**: Tests all 3 pricing categories in one workflow
- **Export Format Validation**: Ensures calculated prices export with proper formatting
- **Round-Trip Integrity**: Validates no data loss through complete workflow
- **Real Cards**: Uses realistic cards (Black Lotus, Lightning Bolt, etc.)

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
npm run test:unit              # CSV utility function tests
npm run test:integration       # Import/export round-trip tests  
npm run test:pricing           # Pricing logic business rule tests
npm run test:pricing-integration # Full workflow integration tests
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Shell Script
```bash
./run_tests.sh
```

## Test Results

All tests validate:
- ✅ **CSV Import/Export**: Perfect data integrity through full round-trip
- ✅ **Pricing Logic**: All business rules correctly implemented
- ✅ **Full Workflow**: Complete Import → Calculate → Export cycle works correctly
- ✅ **Edge Cases**: Boundary conditions and error handling
- ✅ **Real-World Data**: Actual TCGplayer CSV formats and pricing scenarios

## Test Data

The tests use realistic scenarios including:
- Cards with commas in names ("Niv-Mizzet, the Firemind")
- Various price ranges from $0.15 to $250.00
- Different rarity levels (Common, Uncommon, Rare, Mythic)
- Edge cases with decimal precision and rounding
- Boundary conditions at $0.30 and $30.00 thresholds

## Adding New Tests

To add new test scenarios:

1. **CSV Tests**: Add to `csv.test.js` for utility function testing
2. **Integration Tests**: Add to `integration.test.js` for end-to-end validation
3. **Pricing Tests**: Add to `pricing.test.js` for business logic validation
4. **Workflow Tests**: Add to `pricing-integration.test.js` for full workflow testing

Each test should include:
- Clear description of what's being tested
- Expected vs actual result validation
- Edge case coverage
- Real-world applicability
