/* Parse large TCGplayer custom exports off the UI thread. */
importScripts('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');

function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeNumber(value) {
    return normalize(value).replace(/p$/i, '').replace(/^0+(?=\d)/, '');
}

self.onmessage = event => {
    const { type, file } = event.data || {};
    if (type !== 'parse' || !file) return;

    let processed = 0;
    let batch = [];
    const batchSize = 1500;
    let failed = false;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunkSize: 1024 * 1024,
        chunk(results, parser) {
            if (processed === 0 && batch.length === 0) {
                const required = ['TCGplayer Id', 'Set Name', 'Product Name', 'Number', 'Condition'];
                const missing = required.filter(field => !results.meta.fields?.includes(field));
                if (missing.length) {
                    failed = true;
                    parser.abort();
                    self.postMessage({ type: 'error', message: `This CSV is missing required columns: ${missing.join(', ')}.` });
                    return;
                }
            }
            if (results.errors?.length) {
                const fatal = results.errors.find(error => error.code === 'TooFewFields' || error.code === 'TooManyFields');
                if (fatal) {
                    failed = true;
                    parser.abort();
                    self.postMessage({ type: 'error', message: `Malformed CSV near row ${fatal.row + 2}: ${fatal.message}` });
                    return;
                }
            }

            for (const row of results.data) {
                const tcgplayerId = String(row['TCGplayer Id'] || '').trim();
                const productName = String(row['Product Name'] || '').trim();
                const setName = String(row['Set Name'] || '').trim();
                const number = String(row.Number || '').trim();
                const condition = String(row.Condition || '').trim();
                if (!tcgplayerId || !productName || !setName || !condition) continue;

                batch.push({
                    tcgplayerId,
                    matchKey: [normalize(setName), normalizeNumber(number), normalize(condition)].join('|'),
                    productLine: row['Product Line'] || 'Magic',
                    setName,
                    productName,
                    number,
                    rarity: row.Rarity || '',
                    condition,
                    marketPrice: Number.parseFloat(row['TCG Market Price']) || 0,
                    lowPrice: Number.parseFloat(row['TCG Low Price']) || 0,
                    lowShipping: Number.parseFloat(row['TCG Low Price With Shipping']) || 0,
                    tcgDirectLow: Number.parseFloat(row['TCG Direct Low']) || 0
                });
                processed++;

                if (batch.length >= batchSize) {
                    self.postMessage({ type: 'batch', rows: batch, processed });
                    batch = [];
                }
            }
        },
        complete() {
            if (failed) return;
            if (batch.length) self.postMessage({ type: 'batch', rows: batch, processed });
            self.postMessage({ type: 'complete', processed });
        },
        error(error) {
            self.postMessage({ type: 'error', message: error.message || 'CSV parsing failed.' });
        }
    });
};
