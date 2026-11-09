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

// The catalog export has only a Near Mint row for Duress #132. It must not be
// reused for a Lightly Played copy, since TCGplayer may assign different SKUs.
const duressCatalogRow = {
    tcgplayerId: '20334',
    matchKey: CatalogMatching.matchKey("Urza's Saga", '132', 'Near Mint'),
    productName: 'Duress'
};
const duressNearMintKeys = CatalogMatching.lookupKeys("Urza's Saga", '132', 'Near Mint');
const duressLightlyPlayedKeys = CatalogMatching.lookupKeys("Urza's Saga", '132', 'Lightly Played');
assert.strictEqual(
    CatalogMatching.findMatchingRow(duressNearMintKeys.includes(duressCatalogRow.matchKey) ? [duressCatalogRow] : [], 'Duress')?.tcgplayerId,
    '20334',
    'Near Mint Duress #132 should resolve to its exact-condition SKU'
);
assert.strictEqual(
    CatalogMatching.findMatchingRow(duressLightlyPlayedKeys.includes(duressCatalogRow.matchKey) ? [duressCatalogRow] : [], 'Duress'),
    null,
    'Lightly Played Duress #132 must stay unresolved when only a Near Mint SKU exists'
);

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

console.log('✅ Dragon’s Rage Channeler, Duress condition isolation, and Display of Power SKU matching passed');
