#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const pricing = require('../js/pricing');

const DEFAULT_INPUT_PATTERN = /^TCGplayer__MyPricing_.*\.csv$/;
const DEFAULT_OUTPUT_PATTERN = /^updated_inventory_.*\.csv$/;
const PRICE_FIELDS = [
    'TCG Market Price',
    'TCG Low Price With Shipping',
    'TCG Low Price'
];

function usage() {
    return [
        'Usage: node scripts/validate-pricing-output.js [options]',
        '',
        'Options:',
        '  --input <path>       Source TCGplayer pricing CSV',
        '  --output <path>      Updated inventory CSV to validate',
        '  --strategy <id>      Pricing strategy to pass to js/pricing.js',
        '  --tmp <path>         Directory to scan when input/output are omitted',
        '  --help              Show this help',
        '',
        'Defaults:',
        '  --tmp tmp',
        '  --strategy marketAwareLow',
        '  input: newest tmp/TCGplayer__MyPricing_*.csv',
        '  output: newest tmp/updated_inventory_*.csv'
    ].join('\n');
}

function parseArgs(argv) {
    const options = {
        tmpDir: path.join(process.cwd(), 'tmp'),
        strategy: 'marketAwareLow'
    };

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        const next = argv[index + 1];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--input') {
            options.inputPath = requireValue(arg, next);
            index++;
        } else if (arg === '--output') {
            options.outputPath = requireValue(arg, next);
            index++;
        } else if (arg === '--strategy') {
            options.strategy = requireValue(arg, next);
            index++;
        } else if (arg === '--tmp') {
            options.tmpDir = requireValue(arg, next);
            index++;
        } else {
            throw new Error(`Unknown option: ${arg}`);
        }
    }

    return options;
}

function requireValue(flag, value) {
    if (!value || value.startsWith('--')) {
        throw new Error(`${flag} requires a value`);
    }
    return value;
}

function resolveNewestFile(dir, pattern) {
    const files = fs.readdirSync(dir)
        .filter(file => pattern.test(file))
        .map(file => {
            const filePath = path.join(dir, file);
            return { filePath, mtimeMs: fs.statSync(filePath).mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (!files.length) {
        throw new Error(`No files matching ${pattern} found in ${dir}`);
    }

    return files[0].filePath;
}

function parseCsv(filePath) {
    const parsed = Papa.parse(fs.readFileSync(filePath, 'utf8'), {
        header: true,
        skipEmptyLines: true
    });

    if (parsed.errors.length) {
        const firstError = parsed.errors[0];
        throw new Error(`Failed to parse ${filePath}: ${firstError.message}`);
    }

    return parsed.data;
}

function keyFor(row) {
    return `${row['TCGplayer Id']}|${row.Condition || ''}`;
}

function numberValue(value) {
    return Number.parseFloat(value || '0') || 0;
}

function cents(value) {
    return Math.round(numberValue(value) * 100);
}

function money(value) {
    return `$${(Number(value) || 0).toFixed(2)}`;
}

function assertUniqueKeys(rows, label) {
    const counts = new Map();
    for (const row of rows) {
        const key = keyFor(row);
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
    if (duplicates.length) {
        const preview = duplicates.slice(0, 5).map(([key, count]) => `${key} (${count})`).join(', ');
        throw new Error(`${label} has duplicate TCGplayer Id + Condition keys: ${preview}`);
    }
}

function validate(inputRows, outputRows, strategy) {
    const inputByKey = new Map(inputRows.map(row => [keyFor(row), row]));
    const missingRows = [];
    const fieldMismatches = [];
    const priceMismatches = [];

    for (const outputRow of outputRows) {
        const key = keyFor(outputRow);
        const inputRow = inputByKey.get(key);

        if (!inputRow) {
            missingRows.push(outputRow);
            continue;
        }

        for (const field of PRICE_FIELDS) {
            if (cents(outputRow[field]) !== cents(inputRow[field])) {
                fieldMismatches.push({ key, name: outputRow['Product Name'], field, input: inputRow[field], output: outputRow[field] });
            }
        }

        const expectedPrice = pricing.calculatePrice({
            name: inputRow['Product Name'],
            marketPrice: numberValue(inputRow['TCG Market Price']),
            lowPrice: numberValue(inputRow['TCG Low Price']),
            lowShipping: numberValue(inputRow['TCG Low Price With Shipping']),
            originalPrice: numberValue(inputRow['TCG Marketplace Price'])
        }, strategy);
        const actualPrice = pricing.roundPrice(outputRow['TCG Marketplace Price']);

        if (cents(expectedPrice) !== cents(actualPrice)) {
            priceMismatches.push({
                key,
                name: outputRow['Product Name'],
                market: inputRow['TCG Market Price'],
                low: inputRow['TCG Low Price'],
                lowShipping: inputRow['TCG Low Price With Shipping'],
                original: inputRow['TCG Marketplace Price'],
                expected: expectedPrice,
                actual: actualPrice
            });
        }
    }

    return { missingRows, fieldMismatches, priceMismatches };
}

function printPreview(label, rows, formatRow) {
    if (!rows.length) return;
    console.log(`\nFirst ${Math.min(rows.length, 10)} ${label}:`);
    console.table(rows.slice(0, 10).map(formatRow));
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        console.log(usage());
        return;
    }

    if (!pricing.PRICING_STRATEGIES[options.strategy]) {
        throw new Error(`Unknown pricing strategy: ${options.strategy}`);
    }

    const tmpDir = path.resolve(options.tmpDir);
    const inputPath = path.resolve(options.inputPath || resolveNewestFile(tmpDir, DEFAULT_INPUT_PATTERN));
    const outputPath = path.resolve(options.outputPath || resolveNewestFile(tmpDir, DEFAULT_OUTPUT_PATTERN));
    const inputRows = parseCsv(inputPath);
    const outputRows = parseCsv(outputPath);

    assertUniqueKeys(inputRows, 'Input CSV');
    assertUniqueKeys(outputRows, 'Output CSV');

    const result = validate(inputRows, outputRows, options.strategy);

    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Strategy: ${options.strategy}`);
    console.log(`Input rows: ${inputRows.length}`);
    console.log(`Output rows: ${outputRows.length}`);
    console.log(`Missing output rows in input: ${result.missingRows.length}`);
    console.log(`Pricing field mismatches: ${result.fieldMismatches.length}`);
    console.log(`Price mismatches: ${result.priceMismatches.length}`);

    printPreview('missing rows', result.missingRows, row => ({
        id: row['TCGplayer Id'],
        condition: row.Condition,
        name: row['Product Name']
    }));
    printPreview('field mismatches', result.fieldMismatches, row => row);
    printPreview('price mismatches', result.priceMismatches, row => ({
        id: row.key.split('|')[0],
        name: row.name,
        market: money(row.market),
        low: money(row.low),
        lowShipping: money(row.lowShipping),
        original: money(row.original),
        expected: money(row.expected),
        actual: money(row.actual)
    }));

    if (result.missingRows.length || result.fieldMismatches.length || result.priceMismatches.length) {
        process.exitCode = 1;
    }
}

try {
    main();
} catch (error) {
    console.error(error.message);
    console.error('');
    console.error(usage());
    process.exitCode = 1;
}
