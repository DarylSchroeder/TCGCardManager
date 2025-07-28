# Import/Export Round-Trip Fix

## Problem
When importing CSV files with empty fields (like `""`) and then re-exporting them, we were getting problematic patterns like `""",` in the output. This happened because:

1. **Export**: Empty/null values were being exported as quoted empty strings (`""`) instead of truly empty fields
2. **Import**: Quoted empty strings (`""`) were being imported as empty strings (`""`) instead of null values
3. **Re-export**: Empty strings were being re-exported as quoted empty strings again, creating the `""",` pattern

## Root Cause
The issue was in the round-trip data handling:
- **Old export logic**: `escapeCSV('')` returned `'""'` (quoted empty string)
- **Old import logic**: `values[i].replace(/"/g, '')` converted `""` to `""` (still empty string)
- **Result**: Empty fields never became truly null, so they kept getting quoted on export

## Solution
Implemented a proper round-trip conversion system:

### 1. Fixed Export Function (`escapeCSV`)
```javascript
function escapeCSV(value) {
    // Handle NULL, undefined, or empty values as truly empty fields
    if (value === null || value === undefined || value === '') {
        return '';  // Return empty field instead of quoted empty string
    }
    const str = String(value);
    // Always quote non-empty strings to ensure proper CSV formatting
    return '"' + str.replace(/"/g, '""') + '"';
}
```

### 2. Added Import Field Cleaner (`cleanImportedField`)
```javascript
function cleanImportedField(value) {
    if (!value || value.trim() === '') {
        return null;  // Convert empty strings to null for proper export
    }
    // Remove surrounding quotes if present
    const cleaned = value.replace(/^"(.*)"$/, '$1');
    // Handle escaped quotes
    return cleaned.replace(/""/g, '"');
}
```

### 3. Updated Import Logic
Changed from:
```javascript
tcgplayerId: values[0].replace(/"/g, ''),
title: values[4].replace(/"/g, ''),
```

To:
```javascript
tcgplayerId: cleanImportedField(values[0]),
title: cleanImportedField(values[4]),
```

## Results

### Before Fix
```csv
"374437","Magic","9th Edition","Sengir Vampire","","","R","Lightly Played","0.41",""
```
- Empty fields exported as `""`
- Re-export would create `""",` patterns

### After Fix
```csv
"374437","Magic","9th Edition","Sengir Vampire",,,,"R","Lightly Played","0.41",
```
- Empty fields exported as truly empty (`,,,`)
- No more `""",` patterns
- Proper CSV standard compliance

## Testing
Added comprehensive round-trip tests in `test/csv.test.js`:
- Import CSV with quoted empty fields
- Convert to null values during import
- Re-export as truly empty fields
- Verify no `""",` patterns exist

## Files Modified
1. `index.html` - Added `cleanImportedField()` function and updated import logic
2. `test/csv.test.js` - Added round-trip conversion tests

## Verification
The fix eliminates the `""",` pattern issue by ensuring:
1. Empty fields are imported as `null` values
2. `null` values are exported as truly empty fields (no quotes)
3. Round-trip conversion maintains data integrity
4. CSV output follows proper standards

This resolves the issue where files like `TCGplayer__MyPricing_20250727_021453.csv` contained problematic `""",` patterns in the title and number columns.
