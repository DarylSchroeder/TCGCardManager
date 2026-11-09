# Card add troubleshooting

Use this guide when a newly added card has an unexpected price or is missing a TCGplayer SKU.

## Listing price below Market

Check the selected strategy (`tcg_pricing_strategy`) and the exact catalog row used for the card's set, collector number, and finish. The app's default is `shippingAdjusted`; it intentionally targets the shipped low and can list below Market:

1. `estimatedShipping = max(0, lowShipping - lowPrice)`
2. Choose a shipping advantage of `$0.99` when `max(marketPrice, lowPrice) < $2`, `$0.50` below `$10`, or `$0.25` otherwise.
3. Calculate `lowPrice + estimatedShipping - shippingAdvantage`, cap it at `max(marketPrice, lowPrice)`, then apply the `$0.50` floor.

The Market guardrail adds a Review warning when the result is more than 5% or `$0.50` below Market. It does not change the calculated price. `marketAwareLow` or `marketGuardedShippedLow` can be selected when the listing should stay closer to Market. See [pricing.md](pricing.md) for all strategy rules.

For example, Market `$3.56`, Low `$1.49`, and Low With Shipping `$2.98` produce `$2.48` under `shippingAdjusted`: estimated shipping is `$1.49`, and the `$0.50` advantage is subtracted from Low plus estimated shipping.

## SKU not found

The app resolves seller SKUs in `js/catalogMatching.js`, using the imported catalog's set name, collector number, product name, and exact condition/finish. Scryfall's `tcgplayer_id` is a product ID and must not be used as a seller SKU.

- Do not reuse a Near Mint SKU for Lightly Played, or vice versa. Conditions can have different SKUs. If the catalog has no exact-condition row, leave the SKU unresolved, show the Review reason, and block export.
- Check the selected Scryfall printing's `set_name`, `collector_number`, and finish against the CSV's `Set Name`, `Number`, and `Condition`. Finish is part of the condition (for example, `Near Mint Foil`).
- Catalog and Scryfall set names can differ. Add a focused alias in `TCGCatalogMatching.setNameAliases` only when the catalog confirms the mapping. Existing examples include Universes Beyond prefixes and “Modern Horizons 2 Timeshifts.”
- Product variants can append multiple parenthetical labels, such as `(Extended Art) (Surge Foil)`. `normalizeProductName` strips trailing variant labels while matching the base card name.
- Check that the catalog import completed in the same browser origin. The catalog is stored in that origin's IndexedDB; copying a CSV into `tmp/` alone does not load it into the app.
- A log that says the card was priced from Scryfall means the exact-condition catalog pricing lookup did not return a row. Confirm catalog status, then compare all match fields before adding aliases.

Catalog matching regressions belong in `test/catalog-matching.test.js`; `npm test` runs them. The test should model the exact set, number, condition, and catalog product name, including an unresolved case when only another condition exists.

## Stale browser helper or cache-busting URL

The app version-tags `js/catalogMatching.js` in `index.html` so browsers fetch updates. If a helper method is reported missing, inspect the Network response for that exact URL and confirm it returned JavaScript containing the method. The local static server must resolve the URL pathname without its query string; keep that behavior in `server.js` when changing static-file serving.

`[Violation] ... handler took ...ms` messages are browser performance warnings, not exceptions. Investigate uncaught exceptions and failed requests separately.
