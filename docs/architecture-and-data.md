# Architecture and data quick reference

## Runtime and file ownership

- Browser app: `index.html`. It contains layout/styles, Scryfall search and card details, inventory UI, CSV import/export, pricing orchestration, and localStorage persistence.
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
| `name`, `set`, `number`, `rarity` | Card identity/display metadata. |
| `condition` | TCG condition string; may include foil/language suffixes. |
| `quantity` | Number of owned copies. |
| `price` | Legacy/current listing price value. |
| `originalPrice` | Inventory marketplace price before recalculation; preserved by guarded cases. |
| `calculatedPrice` | Most recent calculated listing price. |
| `marketPrice`, `lowPrice`, `lowShipping` | TCG Market, TCG Low, and TCG Low Price With Shipping inputs. |
| `pricingStrategy` | Strategy used on last price update (set during pricing update). |
| `pricingNeedsReview`, `pricingReviewReason` | Missing-low warning state derived from valid market price and absent TCG Low. |
| `tcgplayerId`, `productLine`, `title`, `tcgDirectLow`, `addToQuantity`, `photoUrl` | Optional TCGplayer CSV round-trip fields. |

The app stores inventory in localStorage key `tcg_inventory_v2` and selected strategy in `tcg_pricing_strategy`. Imported price list data uses `tcg_price_data`. Inventory itself is browser-local; there is no database or server-side account storage.

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

Export filters out rows with quantity `<= 0` and always quotes CSV fields. `TCG Marketplace Price` is the listing price returned by `getListingPrice(item)` (calculated price, then original/legacy price fallback).

TCG import maps those columns into the inventory fields above and skips rows with quantity `<= 0`. Standard CSV import also accepts common headers: card name (`Card Name`/`Name`/`name`/`Product Name`/`title`), set (`Set`/`Set Name` and variants), condition, quantity, and `Price`. Treat `index.html` import/export code as authoritative if headers change.
