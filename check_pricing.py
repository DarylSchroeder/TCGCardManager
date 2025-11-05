import csv

# Read source file
source = {}
with open('/root/code/tcg_card_manager/tmp/TCGplayer__Pricing_Custom_Export_20251105_120545.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        tcg_id = row['TCGplayer Id'].strip('"')
        if row['Total Quantity'].strip('"') != '0':  # Only items in inventory
            source[tcg_id] = {
                'market': float(row['TCG Market Price'].strip('"')) if row['TCG Market Price'].strip('"') else 0,
                'low': float(row['TCG Low Price'].strip('"')) if row['TCG Low Price'].strip('"') else 0,
                'original': float(row['TCG Marketplace Price'].strip('"')) if row['TCG Marketplace Price'].strip('"') else 0,
                'name': row['Product Name'].strip('"')
            }

# Read updated file
updated = {}
with open('/root/code/tcg_card_manager/tmp/updated_inventory_2025-11-05.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        tcg_id = row['TCGplayer Id'].strip('"')
        updated[tcg_id] = {
            'price': float(row['TCG Marketplace Price'].strip('"')) if row['TCG Marketplace Price'].strip('"') else 0,
            'name': row['Product Name'].strip('"')
        }

# Compare all lines
errors = []
for tcg_id in source:
    if tcg_id in updated:
        s = source[tcg_id]
        u = updated[tcg_id]
        
        # Calculate expected price
        if s['market'] > 30:
            # Expensive: max(0.5, avg(market, low) - 0.01, original)
            avg_price = (s['market'] + s['low']) / 2
            expected = max(0.5, avg_price - 0.01, s['original'])
        else:
            # Standard: max(0.5, avg(market, low) - 0.01)
            avg_price = (s['market'] + s['low']) / 2
            expected = max(0.5, avg_price - 0.01)
        
        # Check if actual matches expected (within 0.01 tolerance)
        if abs(u['price'] - expected) > 0.01:
            errors.append(f"{tcg_id}: {s['name']} - Expected: ${expected:.2f}, Got: ${u['price']:.2f}, Market: ${s['market']}, Low: ${s['low']}, Original: ${s['original']}")

print(f'Total items checked: {len(source)}')
print(f'Errors found: {len(errors)}')
for error in errors[:20]:  # Show first 20 errors
    print(error)
