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
                { name: 'block.json', target: 'block.json' },
                { name: 'block.css', target: 'block.css' },
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
                block: 'block.jsx',
            },
            output: {
                entryFileNames: (chunk) => {
                    if (chunk.name === 'block') {
                        return 'block.js'
                    }

                    return '[name].js'
                },
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
        __ENVIRONMENT__: JSON.stringify('BLOCK'),
    },
})