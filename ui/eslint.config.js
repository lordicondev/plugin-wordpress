import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat config, replacing the `eslintConfig` block that used to sit in package.json.
 *
 * That block extended `plugin:@figma/figma-plugins/recommended` — a package this project
 * never depended on, left behind when the plugin was forked from the Figma one. Resolution
 * would have failed on the first run, and there was no `lint` script to run it from, so
 * this project has never been linted.
 */

/**
 * Build-time constants injected by Vite's `define`. Declared here as readonly globals so
 * `no-undef` does not flag them; their types live in global.d.ts.
 */
const buildGlobals = {
    __APP__: 'readonly',
    __TITLE__: 'readonly',
    __WEBSITE__: 'readonly',
    __ENVIRONMENT__: 'readonly',
    __SUPPORT_DARK__: 'readonly',
    __SUPPORT_NEW_TAB__: 'readonly',
    __LORDICON__: 'readonly',
};

const sharedRules = {
    // Lottie icon data is genuinely open-shaped; the portal types it as `any` too.
    // A warning keeps it visible without blocking a build.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
        },
    ],
};

export default tseslint.config(
    {
        ignores: ['../dist/**', 'node_modules/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        // Browser code: components, pages, services, helpers, the three entry points, and
        // the render harness - which is browser code too, and needs the same rules.
        files: ['**/*.ts', '**/*.tsx'],
        ignores: ['vite.shared.ts', 'vite-*.config.ts', 'tools/baseline/vite.config.ts'],
        languageOptions: {
            globals: { ...globals.browser, ...buildGlobals },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: sharedRules,
    },
    {
        // The Gutenberg block. Plain JavaScript with JSX that reaches for the `wp` global
        // rather than importing @wordpress/* packages — the dependency list is declared
        // PHP-side in Plugin::enqueue_block_editor_assets().
        files: ['**/*.jsx'],
        languageOptions: {
            globals: { ...globals.browser, ...buildGlobals, wp: 'readonly' },
            parserOptions: {
                ecmaFeatures: { jsx: true },
                projectService: false,
            },
        },
    },
    {
        // Build configuration and Node-side tooling: no tsconfig project.
        files: [
            'vite.shared.ts',
            'vite-*.config.ts',
            'tools/baseline/vite.config.ts',
            'tools/*.mjs',
            'eslint.config.js',
        ],
        languageOptions: {
            globals: globals.node,
            parserOptions: { projectService: false },
        },
        rules: sharedRules,
    },
    {
        // Verification drivers. They run in Node, but the bodies passed to
        // `page.evaluate()` are serialised and run in the browser, so both global sets are
        // legitimately in scope in the same file.
        files: ['tools/driver/**/*.mjs'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
            parserOptions: { projectService: false },
        },
        rules: sharedRules,
    },
);
