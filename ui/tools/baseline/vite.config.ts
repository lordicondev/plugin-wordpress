import path from 'node:path';
import { defineConfig } from 'vite';

/**
 * Dev-only harness that drives the render pipeline directly, without WordPress or the
 * plugin UI. Served from the ui directory so imports into `services/` resolve normally.
 *
 * Port 8097 keeps it clear of the Figma and Slides harnesses (8098-8100) and of the local
 * WordPress (8090).
 */
export default defineConfig({
    root: path.resolve(import.meta.dirname),
    server: {
        host: '127.0.0.1',
        port: 8097,
        fs: {
            allow: [path.resolve(import.meta.dirname, '../..')],
        },
    },
    define: {
        __APP__: JSON.stringify('wp'),
        __TITLE__: JSON.stringify('WordPress'),
        __SUPPORT_DARK__: false,
        __SUPPORT_NEW_TAB__: true,
        __WEBSITE__: JSON.stringify('https://lordicon.com'),
        __ENVIRONMENT__: JSON.stringify('BLOCK'),
    },
});
