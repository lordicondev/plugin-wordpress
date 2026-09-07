import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin, UserConfig } from 'vite';

/**
 * Shared build definition for the plugin's three bundles.
 *
 * The three were copy-pasted configurations that had already drifted apart — the element
 * build was missing the `define` block entirely, so any import reaching for `__WEBSITE__`
 * would have produced a broken bundle with no build error. One factory removes that class
 * of bug.
 */

const UI_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(UI_DIR, '..', 'dist');

/**
 * Which world a bundle runs in. Read at build time via the `__ENVIRONMENT__` global so a
 * shared component can tell the block editor apart from the settings screen.
 */
export type Environment = 'BLOCK' | 'SETTINGS' | 'ELEMENT';

/**
 * One file to copy into dist. A string copies it under its own name; a pair renames it,
 * which is how one token stylesheet becomes the two WordPress enqueues by URL.
 */
type Asset = string | { from: string, to: string };

/**
 * Copies files Vite does not process — the block manifest and the hand-written stylesheets,
 * which WordPress loads by URL rather than importing.
 * @param assets - Files relative to the ui directory.
 */
function copyAssets(assets: Asset[]): Plugin {
    return {
        name: 'lordicon-copy-assets',
        closeBundle: async () => {
            for (const asset of assets) {
                const from = typeof asset === 'string' ? asset : asset.from;
                const to = typeof asset === 'string' ? asset : asset.to;
                await fs.copy(path.join(UI_DIR, from), path.join(DIST_DIR, to));
            }
        },
    };
}

/**
 * Builds one bundle into the shared `dist` directory.
 *
 * `emptyOutDir` is false on purpose: all three builds write to the same directory and would
 * otherwise delete each other's output. `npm run clean` empties it once, up front.
 *
 * @param options.entry - Entry file, relative to the ui directory.
 * @param options.name - Output name; produces `<name>.js`.
 * @param options.environment - Value of the `__ENVIRONMENT__` global.
 * @param options.assets - Extra files to copy verbatim into dist.
 */
export function bundle(options: {
    entry: string;
    name: string;
    environment: Environment;
    assets?: Asset[];
}): UserConfig {
    return defineConfig({
        plugins: [copyAssets(options.assets ?? [])],
        build: {
            // The three bundles are loaded as ES modules (script modules on the front end,
            // a patched <script type="module"> tag in wp-admin), so no downlevelling.
            target: 'esnext',
            rollupOptions: {
                input: { [options.name]: options.entry },
                output: {
                    entryFileNames: '[name].js',
                    dir: DIST_DIR,
                },
            },
            emptyOutDir: false,
        },
        define: {
            __APP__: JSON.stringify('wp'),
            __TITLE__: JSON.stringify('WordPress'),
            __SUPPORT_DARK__: false,
            __SUPPORT_NEW_TAB__: true,
            __WEBSITE__: JSON.stringify('https://lordicon.com'),
            __ENVIRONMENT__: JSON.stringify(options.environment),
        },
    });
}
