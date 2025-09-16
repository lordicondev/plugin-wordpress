=== Lordicon ===
Contributors: lordicon
Tags: lordicon, lottie, animation, icons, animated icons
Stable tag: 1.0 
Requires at least: 6.7  
Tested up to: 6.8  
Requires PHP: 7.2  
License: GPLv2 or later  
License URI: https://www.gnu.org/licenses/gpl-2.0.html  

Enhance Gutenberg pages with animated icons from Lordicon. Add motion and style with high performance.

== Description ==

Lordicon offers a unique library of modern, animated icons designed to bring life and interactivity to your WordPress site. With this plugin, you can seamlessly browse, customize, and insert Lordicon icons directly into the Gutenberg editor.

Built to be fast, lightweight, and easy to use, the Lordicon plugin helps you enrich your content with motion graphics that stay performance-friendly. Whether you need subtle interactions or eye-catching animations, Lordicon provides the flexibility to match your brand and design style.

== Features ==

- Extensive free icon set (with attribution)
- Full icon library available in PRO version (no attribution)
- Insert icons directly into Gutenberg blocks  
- Customize color, stroke, animation type, and trigger  
- Optimized rendering with image fallbacks and lazy-loading for performance  

== Why Choose Lordicon? ==

**Fully Customizable**

Modify icons directly within WordPress: choose colors, animation triggers (hover, click, loop), and more.

**Peak Performance**

Icons are rendered using image fallbacks on initial load and transition to animated formats only when users interact with them—keeping your pages fast and smooth.

**License-Friendly**

Stay compliant with free personal or commercial use through clearly defined licensing plans.

== Installation ==

= Automatic Installation =

1. Navigate to **Plugins > Add New** in your WordPress dashboard.  
2. Search for **Lordicon**.  
3. Click **Install Now**, then **Activate** the plugin.  
4. Go to any Gutenberg page or post and insert a **Lordicon** block to get started.

= Manual Installation =

1. Download the plugin from the WordPress plugin repository.  
2. Upload the contents to the `/wp-content/plugins/lordicon/` directory.  
3. Activate the plugin via the **Plugins** menu.  
4. Insert Lordicon blocks into your Gutenberg content as needed.

== Frequently Asked Questions ==

= Is Lordicon free to use? =

Yes, the plugin and a curated set of icons are free for personal, non-commercial use with required attribution.

To unlock the full icon library, remove attribution, and gain commercial rights, you'll need to subscribe to a PRO plan.

= Do I need a Lordicon account to use this plugin? =

No, you can use the free icons without creating a Lordicon account.

A Lordicon account is only required to access the PRO icon library. You can log in via Settings → Lordicon in your WordPress admin dashboard.

Note: Subscription management (upgrading to PRO, payment, or account settings) is handled on the Lordicon website.

= Do I need a PRO plan? =

You only need the PRO plan if:

- You're using icons for commercial purposes  
- You need attribution-free use  
- You want access to the entire icon library  
- You require advanced customization and multiple downloads  

[Explore our pricing](https://lordicon.com/pricing)

== License ==
The plugin code is licensed under GPLv2 or later.  
However, the Lordicon icons themselves are licensed separately under the [Lordicon License Terms and Conditions](https://lordicon.com/licenses).

== Screenshots ==

1. Insert the Lordicon block directly in the Gutenberg editor to begin.
2. Select from three icon families: Wired, Doodle, or System — each crafted to suit different design needs.  
3. Quickly find the icon you need with an intuitive search experience.
4. Tweak colors, stroke width, animation type, and more — all from within the Gutenberg editor.
5. Add HTML anchors, extra CSS classes, display options, and animation controls for deeper customization.
6. Preview your results in real time.

== Changelog ==
= 1.0 =
* Initial release.

== Development ==

Source code is available on GitHub:  
https://github.com/lordicondev/plugin-wordpress

This plugin includes a frontend build step for its Gutenberg block UI.  

- Source files: `/ui` directory (JavaScript/TypeScript, styles, etc.)  
- Build tool: [Vite](https://vitejs.dev/)  
- Build output: `/dist` directory (included in the distributed plugin)  
- PHP files: top-level plugin files – no build process required  

### Build instructions

Clone the repository and run:

    cd ui
    npm install
    npm run build

This will generate the production-ready frontend assets in `/dist`.
