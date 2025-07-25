# TCG Card Manager - CSV Test Suite

A simple JavaScript test suite to validate CSV import/export functionality.

## Test Coverage

### 1. CSV Parsing Test (`testCSVParsing`)
- Verifies that CSV lines are parsed correctly
- Tests header parsing and field count
- Validates that card names with commas are handled properly
- Ensures decimal quantities are preserved

### 2. CSV Escaping Test (`testCSVEscaping`)
- Tests the `escapeCSV` function with various inputs
- Verifies empty/null values become `""`
- Ensures commas and quotes are properly escaped
- Validates consistent quoting of all fields

### 3. Inventory Export Test (`testInventoryExport`)
- Tests the `formatInventoryRow` function
- Verifies that inventory objects are correctly converted to CSV format
- Ensures field alignment and data integrity

### 4. Round-Trip Test (`testRoundTrip`)
- Imports sample CSV data, exports it, then re-imports
- Verifies that all data is preserved through the cycle
- Ensures no data loss or corruption occurs

## Sample Test Data

The test uses a minimal CSV with 3 cards:
1. **Static Orb** - Standard card with integer quantity
2. **Niv-Mizzet, the Firemind** - Card name with comma + decimal quantity  
3. **Glorious Anthem** - Standard card for baseline testing

## Running the Tests

### Option 1: Using npm (recommended)
```bash
cd test
npm test
```

### Option 2: Using the shell script
```bash
cd test
./run_tests.sh
```

### Option 3: Direct Node.js execution
```bash
cd test
node csv.test.js
```

## Expected Results

All tests should pass, showing:
```
🧪 Running TCG Card Manager CSV Tests

Testing CSV parsing...
✅ CSV parsing tests passed
Testing CSV escaping...
✅ CSV escaping tests passed
Testing inventory export...
✅ Inventory export tests passed
Testing round-trip import/export...
✅ Round-trip tests passed

🎉 All tests passed!
```

## What the Tests Validate

- ✅ CSV parsing handles commas in quoted fields correctly
- ✅ Empty fields export as proper empty strings (`""`)
- ✅ Numeric precision is maintained (including decimals)
- ✅ Import/export cycle preserves all data
- ✅ Special characters and quotes are properly escaped
- ✅ Field alignment is maintained regardless of content

If any tests fail, it indicates issues with the CSV handling logic that need to be addressed before deploying the updated export functionality.
