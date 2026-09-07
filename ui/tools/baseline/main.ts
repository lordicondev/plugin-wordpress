import { RenderService } from '../../services/render.service';
import { CASES, RenderCase } from './cases';
import { buildAnimationSequence, buildFrameSequence } from './sequence-adapter';

import cloudSvg from './icons/cloud.svg?raw';
import cloud from './icons/cloud.json';
import coins from './icons/coins.json';
import gradient from './icons/gradient.json';
import lock from './icons/lock.json';
import morphSelect from './icons/morph-select.json';

/**
 * Runs the render matrix in a real browser and hands the results to the driver through
 * `window.__BASELINE__`.
 *
 * Everything the plugin renders is SVG, so artifacts are captured as text rather than as
 * data URIs — a diff of two runs is then readable, and the driver rasterises them
 * separately when a visual comparison is what is wanted.
 */

const ICONS: Record<string, unknown> = {
    cloud,
    coins,
    gradient,
    lock,
    'morph-select': morphSelect,
};

/** The only SVG pack fixture; `renderSvg` transforms a pack, it does not draw one. */
const PACKS: Record<string, string> = {
    cloud: cloudSvg,
};

interface Artifact {
    name: string;
    source: string;
}

const service = new RenderService();
const artifacts: Artifact[] = [];
const report: Record<string, unknown> = {};

function log(message: string) {
    const el = document.getElementById('log')!;
    el.textContent = `${el.textContent}\n${message}`;
}

/**
 * Reads a Blob back as text. The service returns Blobs because that is what the upload
 * path needs; the harness wants the source.
 * @param blob - Blob produced by the render service.
 */
function blobToText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

async function runCase(testCase: RenderCase) {
    const iconData = ICONS[testCase.icon];
    const animation = buildAnimationSequence(iconData, testCase);
    const frameSequence = buildFrameSequence(iconData, testCase);

    // Only the visual properties reach the renderer — the same subset export() hashes.
    const properties = {
        state: testCase.state,
        ...(testCase.properties ?? {}),
    };

    report[testCase.id] = {
        state: testCase.state,
        playback: testCase.playback,
        delay: testCase.delay,
        speed: testCase.speed,
        properties,
        frameSequence,
        animation,
    };

    for (const format of testCase.formats) {
        log(`${testCase.id} -> ${format}`);

        if (format === 'frame-svg') {
            const result = await service.renderFrameSvg(iconData, {
                sequence: frameSequence,
                properties,
            });
            artifacts.push({ name: `${testCase.id}.frame.svg`, source: await blobToText(result.image) });
        } else if (format === 'pack-svg') {
            const pack = PACKS[testCase.icon];
            if (!pack) {
                log(`  no pack fixture for ${testCase.icon}, skipped`);
                continue;
            }
            const result = await service.renderSvg(pack, { properties });
            artifacts.push({ name: `${testCase.id}.pack.svg`, source: await blobToText(result.image) });
        }
    }
}

async function run() {
    for (const testCase of CASES) {
        try {
            await runCase(testCase);
        } catch (e) {
            report[testCase.id] = { error: (e as Error)?.message || String(e) };
            log(`FAILED ${testCase.id}: ${(e as Error)?.message}`);
        }
    }

    (window as unknown as Record<string, unknown>).__BASELINE__ = { report, artifacts };
    log('DONE');
    document.title = 'baseline:done';
}

run();
