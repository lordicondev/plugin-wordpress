import { defineConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';

function assetsHandlerPlugin() {
    return {
        name: 'assets-handler',
        closeBundle: async () => {
            const srcDir = path.resolve(__dirname);
            const distDir = path.resolve(__dirname, '..', 'dist');
            const assets: { name: string, target: string }[] = [
                { name: 'settings.css', target: 'settings.css' },
            ];

            for (const current of assets) {
                const srcFile = path.join(srcDir, current.name);
                const destFile = path.join(distDir, current.target);

                await fs.copy(srcFile, destFile);
            }
        }
    }
}

export default defineConfig({
    plugins: [
        assetsHandlerPlugin(),
    ],
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                settings: 'settings.ts',
            },
            output: {
                entryFileNames: (chunk) => {
                    return '[name].js'
                },
                // format: 'iife',
                dir: '../dist',
            },
        },
        emptyOutDir: false,
    },
    define: {
        __APP__: "'wp'",
        __TITLE__: "'WordPress'",
        __SUPPORT_DARK__: false,
        __SUPPORT_NEW_TAB__: true,
        __WEBSITE__: JSON.stringify('https://lordicon.com'),
        __ENVIRONMENT__: JSON.stringify('SETTINGS'),
    },
})