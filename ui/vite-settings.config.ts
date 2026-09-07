import { bundle } from './vite.shared';

// The wp-admin settings screen: welcome, login and account pages.
export default bundle({
    entry: 'settings.ts',
    name: 'settings',
    environment: 'SETTINGS',
    assets: [{ from: 'tokens.css', to: 'settings.css' }],
});
