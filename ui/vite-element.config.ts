import { bundle } from './vite.shared';

// The published-site bundle: registers the <lord-icon> custom element and nothing else.
export default bundle({
    entry: 'element.tsx',
    name: 'element',
    environment: 'ELEMENT',
    assets: ['element.css'],
});
