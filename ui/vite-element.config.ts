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
                { name: 'element.css', target: 'element.css' },
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
                element: 'element.tsx',
            },
            output: {
                entryFileNames: (chunk) => {
                    return '[name].js'
                },
                dir: '../dist',
            },
        },
        emptyOutDir: false,
    },
})