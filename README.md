# Lordicon – Animated Icons for WordPress

Effortlessly enhance your Gutenberg pages with beautifully animated icons from the Lordicon library. Add motion and style without compromising performance.

Lordicon offers a unique library of modern, animated icons designed to bring life and interactivity to your WordPress site. With this plugin, you can seamlessly browse, customize, and insert Lordicon icons directly into the Gutenberg editor.

Built to be fast, lightweight, and easy to use, the Lordicon plugin helps you enrich your content with motion graphics that stay performance-friendly. Whether you need subtle interactions or eye-catching animations, Lordicon provides the flexibility to match your brand and design style.

## Features

- Extensive free icon set (with attribution)
- Full icon library available in PRO version (no attribution)
- Insert icons directly as Gutenberg blocks  
- Customize colors, stroke, animation type, and triggers  
- Optimized for performance with image fallbacks and lazy loading  

## Frequently Asked Questions

### Is Lordicon free to use?
Yes, the plugin and a curated set of icons are free for personal, non-commercial use with required attribution.

To unlock the full icon library, remove attribution, and gain commercial rights, you'll need to subscribe to a PRO plan.

### Do I need a Lordicon account to use this plugin?
No, you can use the free icons without creating a Lordicon account.

A Lordicon account is only required to access the PRO icon library. You can log in via **Settings → Lordicon** in your WordPress admin dashboard.

**Note:** Subscription management (upgrading to PRO, payment, or account settings) is handled on the Lordicon website.

### Do I need a PRO plan?
You only need the PRO plan if:

- You're using icons for commercial purposes  
- You need attribution-free use  
- You want access to the entire icon library  
- You require advanced customization and multiple downloads

[Explore our pricing](https://lordicon.com/pricing)

## License

- Plugin code: [GPLv2 or later](https://www.gnu.org/licenses/gpl-2.0.html)  
- Icons: [Lordicon License Terms](https://lordicon.com/licenses)  

## Development

This plugin includes a frontend build step for its Gutenberg block UI.

- Source files: `/ui` directory (JavaScript/TypeScript, styles, etc.)
- Build tool: [Vite](https://vitejs.dev/)
- Build output: `/dist` directory (included in the distributed plugin)
- PHP files: top-level plugin files – no build process required

### Build instructions

Clone the repository and run:

```bash
cd ui
npm install
npm run build
```

This will generate the production-ready frontend assets in /dist.

## Links

- [Lordicon Website](https://lordicon.com)  
- [Pricing](https://lordicon.com/pricing)