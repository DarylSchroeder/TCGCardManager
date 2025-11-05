import csv

# Read source file and find items with missing low prices
missing_low = []
with open('/root/code/tcg_card_manager/tmp/TCGplayer__Pricing_Custom_Export_20251105_120545.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['Total Quantity'].strip('"') != '0':  # Only items in inventory
            low_price = row['TCG Low Price'].strip('"')
            if not low_price or low_price == '0' or low_price == '':
                missing_low.append({
                    'id': row['TCGplayer Id'].strip('"'),
                    'name': row['Product Name'].strip('"'),
                    'market': row['TCG Market Price'].strip('"'),
                    'low': low_price,
                    'original': row['TCG Marketplace Price'].strip('"')
                })

print(f"Items with missing/zero TCG Low Price: {len(missing_low)}")
for item in missing_low[:10]:
    print(f"{item['id']}: {item['name']} - Market: ${item['market']}, Low: '{item['low']}', Original: ${item['original']}")
