import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Builds the distributable plugin archive.
 *
 * The repository holds far more than the plugin: sources, a toolchain, a render harness and
 * an npm auth token. None of that belongs on a site that installs the plugin, and until now
 * nothing stopped it going out — there was no packaging step at all, so `ui/` shipped whole.
 *
 * Everything listed in `.distignore` is left behind. The archive contains a single top-level
 * `lordicon/` directory, which is what WordPress expects to unpack into wp-content/plugins.
 *
 *   node tools/package.mjs
 */
const UI_DIR = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const ROOT = path.dirname(UI_DIR);
const SLUG = 'lordicon';

/**
 * Reads `.distignore` into a list of patterns, dropping comments and blank lines.
 */
function readIgnorePatterns() {
    const file = path.join(ROOT, '.distignore');
    return fs.readFileSync(file, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
}

/**
 * Reads the plugin version from the header, which is the value WordPress itself trusts.
 */
function readVersion() {
    const header = fs.readFileSync(path.join(ROOT, `${SLUG}.php`), 'utf8');
    const match = header.match(/^\s*\*\s*Version:\s*(.+)$/m);
    if (!match) {
        throw new Error('no Version header in ' + `${SLUG}.php`);
    }
    return match[1].trim();
}

const version = readVersion();
const archive = path.join(ROOT, `${SLUG}-${version}.zip`);

// dist/ is what the archive is mostly for; refuse to ship an empty or stale one.
if (!fs.existsSync(path.join(ROOT, 'dist', 'block.js'))) {
    console.error('dist/ is missing or incomplete — run `npm run build` first.');
    process.exit(1);
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'lordicon-package-'));
const target = path.join(staging, SLUG);

// rsync applies the exclusions in one pass and preserves the tree; the alternative is
// reimplementing glob matching here, badly.
const excludes = readIgnorePatterns().flatMap((pattern) => ['--exclude', pattern]);
execFileSync('rsync', ['-a', ...excludes, `${ROOT}/`, `${target}/`], { stdio: 'inherit' });

fs.rmSync(archive, { force: true });
execFileSync('zip', ['-rq', archive, SLUG], { cwd: staging, stdio: 'inherit' });
fs.rmSync(staging, { recursive: true, force: true });

const size = fs.statSync(archive).size;
const listing = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

console.log(`${path.basename(archive)}  ${(size / 1024).toFixed(0)} KB, ${listing.length} entries`);

// A guard rather than a comment: if an exclusion ever stops matching, the build fails here
// instead of publishing sources.
const leaked = listing.filter((entry) => /(^|\/)(ui|node_modules|\.git|\.npmrc|\.distignore)(\/|$)/.test(entry));
if (leaked.length) {
    console.error('\nDevelopment files leaked into the archive:');
    for (const entry of leaked.slice(0, 20)) console.error('  ' + entry);
    process.exit(1);
}
