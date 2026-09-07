# Lordicon for WordPress

Gutenberg block for inserting Lordicon's animated icons. The plugin embeds the icon's Lottie
file in the media library and renders it with `<lord-icon>`, with a static SVG standing in
until the animation comes alive.

User-facing documentation is in [readme.txt](readme.txt), which is what WordPress.org renders.

## Requirements

- WordPress 6.7+ (tested up to 7.1), PHP 7.4+
- Node 20+ to build the editor UI

## Layout

```
lordicon.php        plugin header and bootstrap
includes/           PHP: block registration, rendering, AJAX endpoints, API client
ui/                 sources for the three bundles (not shipped)
dist/               build output (shipped, git-ignored)
```

Three bundles come out of `ui/`:

| bundle | where it runs |
|---|---|
| `block.js` | the Gutenberg editor — block registration plus the Lit icon picker |
| `element.js` | the published page, and the editor canvas iframe — defines `<lord-icon>` |
| `settings.js` | the wp-admin settings screen |

## Build

```bash
cd ui
npm install
npm run build        # writes ../dist
npm run dev          # the same, in watch mode
```

```bash
npm run lint
npm run typecheck
```

## Package

```bash
cd ui && npm run package
```

Builds, then writes `lordicon-<version>.zip` at the repository root containing only what a
site needs. Everything in [.distignore](.distignore) is left out — sources, toolchain,
credentials — and the script fails rather than publishing them if an exclusion ever stops
matching.

Keep three places in step when releasing: the `Version` header in `lordicon.php`,
`Constants::PLUGIN_VERSION`, and `Stable tag` in `readme.txt`.

## Local WordPress

A ready-made WordPress 7.1 environment, with this plugin mounted in place and Plugin Check
installed, lives in the sibling `plugin-wordpress-dev-env` repository. See its README.

## Render harness

`ui/tools/baseline` drives the render pipeline directly in a browser over a fixed matrix of
icons and settings, and `ui/tools/driver` captures the results:

```bash
npm run baseline:serve                    # in one shell
npm run baseline:capture -- /tmp/after     # in another
```

Compare two captures to see whether a change altered what the plugin draws.
