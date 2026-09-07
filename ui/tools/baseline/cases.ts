/**
 * Render matrix used to detect regressions across refactors.
 *
 * Cases are stated in a *neutral* vocabulary — `playback`, explicit `delay`, explicit
 * `speed` — rather than in whatever shape the code happens to accept today. The translation
 * lives in `sequence-adapter.ts`, so the matrix itself stays fixed across the model change
 * and a diff of two runs shows pipeline behaviour, not renamed parameters.
 *
 * Delays are stated rather than defaulted for the same reason: the default delay values are
 * themselves changing, and would otherwise mask everything else.
 */

import { Stroke } from '@lordicon/utils-lottie';

export type IconName = 'cloud' | 'lock' | 'morph-select' | 'coins' | 'gradient';

export type Playback = 'once' | 'reverse' | 'boomerang' | 'continuous';

/** What the plugin can produce. Both are SVG — WordPress embeds JSON and renders a poster. */
export type Format = 'frame-svg' | 'pack-svg';

export interface RenderCase {
    id: string;
    icon: IconName;
    state: string;
    playback: Playback;
    /** Milliseconds. `[main, mid]`; the mid slot is morph-only. */
    delay: number[];
    speed: number;
    formats: Format[];
    /** Icon properties applied before rendering — stroke and colour overrides. */
    properties?: { stroke?: Stroke; colors?: Record<string, string> };
}

const D = [1000, 1000];

export const CASES: RenderCase[] = [
    // --- in ------------------------------------------------------------------------
    { id: 'cloud-in-once', icon: 'cloud', state: 'in-reveal', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'cloud-in-reverse', icon: 'cloud', state: 'in-reveal', playback: 'reverse', delay: D, speed: 1, formats: [] },
    { id: 'lock-in-once', icon: 'lock', state: 'in-reveal', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },

    // --- hover ---------------------------------------------------------------------
    { id: 'cloud-hover-once', icon: 'cloud', state: 'hover-pinch', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'cloud-hover-continuous', icon: 'cloud', state: 'hover-pinch', playback: 'continuous', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'cloud-hover-speed2', icon: 'cloud', state: 'hover-pinch', playback: 'continuous', delay: D, speed: 2, formats: [] },
    { id: 'lock-hover-once', icon: 'lock', state: 'hover-locked', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'gradient-hover-continuous', icon: 'gradient', state: 'hover-pinch', playback: 'continuous', delay: D, speed: 1, formats: ['frame-svg'] },

    // --- morph: no split ratio, so enter/leave are play and play:reverse ------------
    { id: 'lock-morph-once', icon: 'lock', state: 'morph-unlocked', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'lock-morph-boomerang', icon: 'lock', state: 'morph-unlocked', playback: 'boomerang', delay: D, speed: 1, formats: [] },
    { id: 'lock-morph-continuous', icon: 'lock', state: 'morph-unlocked', playback: 'continuous', delay: D, speed: 1, formats: ['frame-svg'] },

    // --- morph: split ratio 0.5, so enter/leave are frame ranges --------------------
    { id: 'select-morph-once', icon: 'morph-select', state: 'morph-select', playback: 'once', delay: D, speed: 1, formats: ['frame-svg'] },
    { id: 'select-morph-boomerang', icon: 'morph-select', state: 'morph-select', playback: 'boomerang', delay: D, speed: 1, formats: [] },
    { id: 'select-morph-continuous', icon: 'morph-select', state: 'morph-select', playback: 'continuous', delay: D, speed: 1, formats: ['frame-svg'] },

    // --- loop ----------------------------------------------------------------------
    { id: 'cloud-loop-continuous', icon: 'cloud', state: 'loop-cycle', playback: 'continuous', delay: [0, 0], speed: 1, formats: ['frame-svg'] },
    { id: 'coins-loop-continuous', icon: 'coins', state: 'loop-spin', playback: 'continuous', delay: [0, 0], speed: 1, formats: ['frame-svg'] },

    // --- zero delay, to catch the empty-token edge of the sequence grammar ----------
    { id: 'cloud-hover-nodelay', icon: 'cloud', state: 'hover-pinch', playback: 'continuous', delay: [0, 0], speed: 1, formats: [] },

    // --- customisation: these exercise customizeIcon / customizeSvg -----------------
    { id: 'cloud-stroke1', icon: 'cloud', state: 'hover-pinch', playback: 'once', delay: D, speed: 1, formats: ['frame-svg', 'pack-svg'], properties: { stroke: 1 } },
    { id: 'cloud-stroke3', icon: 'cloud', state: 'hover-pinch', playback: 'once', delay: D, speed: 1, formats: ['frame-svg', 'pack-svg'], properties: { stroke: 3 } },
    { id: 'cloud-colors', icon: 'cloud', state: 'hover-pinch', playback: 'once', delay: D, speed: 1, formats: ['frame-svg', 'pack-svg'], properties: { colors: { primary: '#08a88a' } } },
    { id: 'cloud-plain', icon: 'cloud', state: 'hover-pinch', playback: 'once', delay: D, speed: 1, formats: ['pack-svg'] },
];
