# Architecture and data quick reference

## Runtime and file ownership

- Browser app: `index.html`. It contains layout/styles, Scryfall search and card details, inventory UI, CSV import/export, pricing orchestration, and inventory persistence.
- Pricing module: `js/pricing.js`. It is a UMD-style module usable from both Node tests/scripts and the browser.
- Static HTTP server: `server.js`, using Node's built-in `http`, on port `3000`. `run.sh` starts it; `npm start` delegates to `run.sh`.
- Image caching support: `js/imageCache.js`; server prefetching is disabled by default.
- Output validation: `scripts/validate-pricing-output.js`, which calls `js/pricing.js` instead of maintaining separate calculation logic.

## Inventory object

The browser inventory uses objects with these fields (some are optional by import source):

| Field | Meaning |
| --- | --- |
| `id` | Local unique row id. |
| `cardId` | Scryfall id or import placeholder. |
| `name`, `set`, `number`, `rarity` | Visible product/card name and printing metadata. Imported TCGplayer product names are preserved for display/export. |
| `identityName` | Canonical card identity used for alphabetical sorting, inventory matching, and name-based pricing exclusions. Usually matches `name`. |
| `condition` | TCG condition string; may include foil/language suffixes. |
| `quantity` | Number of owned copies. |
| `addToQuantity` | Quantity adjustment delta sent to TCGplayer. Search Cards adds increment both local `quantity` and this delta. |
| `price` | Legacy/current listing price value. |
| `originalPrice` | Inventory marketplace price before recalculation; preserved by guarded cases. |
| `calculatedPrice` | Most recent calculated listing price. |
| `marketPrice`, `lowPrice`, `lowShipping` | TCG Market, TCG Low, and TCG Low Price With Shipping inputs. |
| `pricingStrategy` | Strategy used on last price update (set during pricing update). |
| `pricingNeedsReview`, `pricingReviewReason` | Missing-low warning state derived from valid market price and absent TCG Low. |
| `tcgplayerId`, `productLine`, `title`, `tcgDirectLow`, `addToQuantity`, `photoUrl` | TCGplayer CSV fields. `tcgplayerId` must be the seller SKU, not a TCGplayer product ID. |
| `tcgplayerProductId` | Scryfall's TCGplayer product ID; retained separately and never exported into the seller SKU column. |
| `tcgProductName`, `tcgSetName`, `tcgNumber`, `tcgProductLine` | Canonical TCGplayer catalog details used when a catalog row resolves the selected printing and finish. |

When adding a card from Search Cards, a matching imported TCGplayer row supplies its pricing fields. If its Market Price is missing, the app falls back to the Scryfall card object's daily finish-specific price (`prices.usd`, `prices.usd_foil`, or `prices.usd_etched`). With no TCG Low, the card starts at that market baseline (at least `$0.50`) and is flagged for pricing review; low-based repricing preserves that baseline until TCG Low is available. If neither source provides a market price, the card is added at `$0`.

Scryfall's `tcgplayer_id` is a product ID. TCGplayer seller CSV's `TCGplayer Id` field is a SKU ID that identifies the specific finish and condition. They are different identifier types even though their names are similar. Import the custom TCGplayer catalog CSV from the Search Cards panel to resolve the correct SKU and canonical product fields by set, collector number, name, and condition/finish. A Web Worker streams the CSV in chunks; only compact lookup and pricing fields are stored in IndexedDB. Search Cards reads matching rows from IndexedDB instead of loading the full catalog into page memory. Until a SKU resolves, the row shows a Review indicator and export is blocked to avoid submitting a product ID in the SKU field. Scryfall remains the fallback source for daily market price. For TCGplayer CSV output, keep `Title` blank and use TCGplayer rarity codes (`C`, `U`, `R`, `M`, etc.).

For TCGplayer imports from `FINAL FANTASY: Through the Ages`, the canonical identity used for sorting and matching comes from the suffix of TCGplayer's alternate-name product title (for example, `Squall Leonhart - Danitha Capashen, Paragon (Showcase)` sorts as `Danitha Capashen, Paragon`). The visible name and original TCGplayer Product Name are retained and exported unchanged.

Inventory is saved in localStorage under `tcg_inventory_v2`. On reload, the app asks whether to clear previously saved inventory or keep it; choosing clear removes the saved cache, while choosing keep restores it. The selected strategy is stored in `tcg_pricing_strategy`; the compact TCGplayer price catalog is stored in IndexedDB and persists across reloads.

The inventory view can hide rows whose current listing price is below `$0.51`, `$1`, `$2`, or `$5`. This is a display filter only: hidden rows remain in inventory, are included in CSV exports, and are unaffected by bulk actions in the filtered view.

## TCGplayer CSV contract

Exported rows use these headers in this order:

1. `TCGplayer Id`
2. `Product Line`
3. `Set Name`
4. `Product Name`
5. `Title`
6. `Number`
7. `Rarity`
8. `Condition`
9. `TCG Market Price`
10. `TCG Direct Low`
11. `TCG Low Price With Shipping`
12. `TCG Low Price`
13. `Total Quantity`
14. `Add to Quantity`
15. `TCG Marketplace Price`
16. `Photo URL`

`Total Quantity` is reference-only in TCGplayer imports; quantity changes are applied from `Add to Quantity` (positive adds, negative removes, zero leaves quantity unchanged). Export filters out rows with quantity `<= 0` and always quotes CSV fields. `TCG Marketplace Price` is the listing price returned by `getListingPrice(item)` (calculated price, then original/legacy price fallback).

TCG import maps those columns into the inventory fields above and skips rows with quantity `<= 0`. Standard CSV import also accepts common headers: card name (`Card Name`/`Name`/`name`/`Product Name`/`title`), set (`Set`/`Set Name` and variants), condition, quantity, and `Price`. Treat `index.html` import/export code as authoritative if headers change.
