import { bundle } from './vite.shared';

// The Gutenberg editor bundle: the block registration plus the whole Lit icon picker that
// mounts into the inspector sidebar.
export default bundle({
    entry: 'block.jsx',
    name: 'block',
    environment: 'BLOCK',
    assets: ['block.json', { from: 'tokens.css', to: 'block.css' }],
});
