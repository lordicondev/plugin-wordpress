import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

/**
 * Drives the render harness and writes, for every case: the produced SVG, a rasterised PNG
 * of it, and a `report.json` of the sequences that made them. Run it before and after a
 * change that touches rendering; a diff of the two directories is the regression check.
 *
 * Start the harness first: `npm run baseline:serve`.
 *
 *   node tools/driver/render-report.mjs <out-dir>
 *
 * Two things this driver does that are not obvious:
 *
 * 1. **It normalises element ids.** A lottie player stamps `__lottie_element_<n>` ids into
 *    the DOM it builds, drawn from a counter global to the page, so the same icon
 *    serialises differently depending on how many icons were rendered before it. The render
 *    service now runs its output through SVGO, which renames those ids deterministically —
 *    but the SVG-pack path does not go through SVGO, and any future path might not either,
 *    so the driver still normalises. It is a no-op when the pipeline is already stable.
 *
 * 2. **It rasterises.** The point of the comparison is what a visitor sees, not which
 *    markup produced it. When the SVG generator changes, the bytes are expected to differ
 *    and the pixels are not.
 */
const OUT = process.argv[2];
const URL = process.env.HARNESS_URL || 'http://127.0.0.1:8097/';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const RASTER_SIZE = 256;

if (!OUT) {
    console.error('usage: node tools/driver/render-report.mjs <out-dir>');
    process.exit(1);
}

/**
 * Rewrites generator-assigned ids to their order of first appearance, so the same drawing
 * serialises the same way regardless of what was rendered before it.
 * @param {string} source - SVG source.
 * @returns {string} The SVG with stable ids.
 */
function normaliseIds(source) {
    const seen = new Map();
    return source.replace(/__lottie_element_(\d+)/g, (_match, n) => {
        if (!seen.has(n)) {
            seen.set(n, `__id_${seen.size}`);
        }
        return seen.get(n);
    });
}

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    protocolTimeout: 0,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction('document.title === "baseline:done"', { timeout: 600000 });

// Evaluated inside the page, where `window` is the harness's own.
const { report, artifacts } = await page.evaluate('window.__BASELINE__');

await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');

for (const artifact of artifacts) {
    await fs.writeFile(path.join(OUT, artifact.name), normaliseIds(artifact.source));
}

// --- rasterise ----------------------------------------------------------------------
// A fresh page with a transparent background; each SVG is loaded as an <img> so it is
// rendered by the browser's own SVG engine rather than by anything in the pipeline.
const raster = await browser.newPage();
await raster.setViewport({ width: RASTER_SIZE, height: RASTER_SIZE, deviceScaleFactor: 1 });
await raster.setContent('<style>html,body{margin:0;background:transparent}</style>');

for (const artifact of artifacts) {
    const png = await raster.evaluate(async (source, size) => {
        const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));
        const image = new Image(size, size);
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error('svg failed to decode'));
            image.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.getContext('2d').drawImage(image, 0, 0, size, size);
        return canvas.toDataURL('image/png').split(',')[1];
    }, artifact.source, RASTER_SIZE);

    const name = artifact.name.replace(/\.svg$/, '.png');
    await fs.writeFile(path.join(OUT, name), Buffer.from(png, 'base64'));
}

const failures = Object.entries(report).filter(([, value]) => value && value.error);
console.log(`wrote ${artifacts.length} SVG + ${artifacts.length} PNG + report.json to ${OUT}`);
if (failures.length) {
    console.log(`\n${failures.length} case(s) failed:`);
    for (const [id, value] of failures) console.log(`  ${id}: ${value.error}`);
}

await browser.close();
process.exit(failures.length ? 1 : 0);
