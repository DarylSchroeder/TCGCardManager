const assert = require('assert');
const CatalogMatching = require('../js/catalogMatching');

// Rows copied from the catalog export in tmp/TCGplayer__Pricing_Custom_Export_20261108_094328.csv.
// Keep this regression explicit: Scryfall calls the set "Modern Horizons 2 Timeshifts",
// while the catalog calls it "Modern Horizons 2" and marks the product Retro Frame.
const catalogRows = [
    {
        tcgplayerId: '7928549',
        matchKey: CatalogMatching.matchKey('Modern Horizons 2', '9', 'Near Mint'),
        productName: "Dragon's Rage Channeler (Retro Frame)"
    },
    {
        tcgplayerId: '7928554',
        matchKey: CatalogMatching.matchKey('Modern Horizons 2', '9', 'Near Mint Foil'),
        productName: "Dragon's Rage Channeler (Retro Frame)"
    },
    {
        tcgplayerId: '4980405',
        matchKey: CatalogMatching.matchKey('Modern Horizons 2', '121', 'Near Mint'),
        productName: "Dragon's Rage Channeler"
    }
];

function lookup(condition) {
    const keys = CatalogMatching.lookupKeys('Modern Horizons 2 Timeshifts', '9', condition);
    const candidates = catalogRows.filter(row => keys.includes(row.matchKey));
    return CatalogMatching.findMatchingRow(candidates, "Dragon's Rage Channeler");
}

assert.strictEqual(lookup('Near Mint')?.tcgplayerId, '7928549', 'nonfoil Timeshifts #9 should resolve to its SKU');
assert.strictEqual(lookup('Near Mint Foil')?.tcgplayerId, '7928554', 'foil Timeshifts #9 should resolve to its SKU');

// The catalog export has one SKU row for Duress #132 in Near Mint condition.
// Inventory conditions such as Lightly Played use the same SKU for that finish.
const duressCatalogRow = {
    tcgplayerId: '20334',
    matchKey: CatalogMatching.matchKey("Urza's Saga", '132', 'Near Mint'),
    productName: 'Duress'
};
const duressFallbackCondition = CatalogMatching.skuFallbackCondition('Lightly Played');
const duressLookupKeys = CatalogMatching.lookupKeys("Urza's Saga", '132', duressFallbackCondition);
const duressSku = CatalogMatching.findMatchingRow(
    duressLookupKeys.includes(duressCatalogRow.matchKey) ? [duressCatalogRow] : [],
    'Duress'
);
assert.strictEqual(duressSku?.tcgplayerId, '20334', 'Lightly Played Duress #132 should reuse its Near Mint SKU');
assert.strictEqual(CatalogMatching.skuFallbackCondition('Lightly Played Foil'), 'Near Mint Foil', 'foil conditions should retain foil SKU matching');

// The foil #769 catalog name carries two nested product-variant suffixes.
const displayOfPowerRow = {
    tcgplayerId: '7445816',
    matchKey: CatalogMatching.matchKey('Universes Beyond: The Lord of the Rings: Tales of Middle-earth', '769', 'Near Mint Foil'),
    productName: 'Display of Power (Extended Art) (Surge Foil)'
};
const displayKeys = CatalogMatching.lookupKeys('The Lord of the Rings: Tales of Middle-earth', '769', 'Near Mint Foil');
const displaySku = CatalogMatching.findMatchingRow(
    displayKeys.includes(displayOfPowerRow.matchKey) ? [displayOfPowerRow] : [],
    'Display of Power'
);
assert.strictEqual(displaySku?.tcgplayerId, '7445816', 'Display of Power #769 foil should resolve despite stacked product suffixes');

console.log('✅ Dragon’s Rage Channeler, Duress, and Display of Power SKU matching passed');
