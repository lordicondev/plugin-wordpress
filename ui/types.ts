import { Stroke } from '@lordicon/utils-lottie';

/**
 * Shared editor model. Mirrors `features/library/types.ts` in the portal and the same file
 * in the Figma plugin, so the three projects describe the same concepts with the same
 * names. Only the format list differs: WordPress embeds an interactive Lottie or a static
 * SVG, and renders no raster images at all.
 */

export type AnimationTrigger = 'in' | 'hover' | 'morph' | 'loop';

export type AnimationPlayback = 'once' | 'reverse' | 'boomerang' | 'continuous';

/**
 * Formats the block can insert.
 * - `json` — the Lottie file, played by `<lord-icon>` on the published page.
 * - `svg` — a single customised frame, inserted as a plain `<img>`.
 */
export type ExportFormat = 'json' | 'svg';

/**
 * Animation playback settings. Grouped because they are only meaningful as a unit —
 * changing one usually means reconsidering the others.
 */
export interface AnimationSettings {
    playback?: AnimationPlayback;
    /** Multiplier; 1 is the icon's authored speed. */
    speed?: number;
    /** Milliseconds. `[0]` is the main pause, `[1]` the mid-cycle pause (morph only). */
    delay?: number[];
    /**
     * Play the icon's `in-` state once when it first appears, then hand over to the
     * trigger. WordPress-only: it maps to the `intro` attribute on `<lord-icon>`, which
     * has no counterpart in a rendered export.
     */
    intro?: boolean;
}

/**
 * One segment of the playback timeline, in the order a viewer perceives it.
 *
 * Carries `duration` — the Figma plugin's copy of this type omits it even though its
 * builder produces it, because nothing there reads it. Here the preview's scrub bar does.
 */
export interface SectionInterface {
    animation: boolean;
    ratio: number;
    title: string;
    /** Milliseconds. */
    duration: number;
}

/**
 * The block's persisted `properties` attribute.
 *
 * **This is a public contract.** Instances of it are sitting in the content of every post
 * ever built with this plugin, and `Plugin::render_block()` reads them back field by field.
 * Nothing here may change meaning, and nothing may be dropped — see
 * `notes/plugin-wordpress/data-contract.md` in the dev-env repository.
 *
 * The animation fields are a superset on purpose. `playback` is the model the editor works
 * in; `intro` and `loop` are what older versions wrote and what PHP falls back to when
 * `playback` is absent. Both are written on every save so that a downgrade stays safe.
 */
export interface BlockProperties {
    format: ExportFormat;
    /** Pixels. Rendered as an inline width/height style. */
    size: number;
    stroke: Stroke;
    /** State name, e.g. `hover-pinch`. Its prefix is the trigger. */
    state: string;
    /** Keyed by property name (`primary`, `secondary`, …). */
    colors: Record<string, string>;

    /** Playback mode. Absent on anything written before this was introduced. */
    playback?: AnimationPlayback;
    /** Legacy mirror of `playback === 'continuous'`. Still written, still read by PHP. */
    loop: boolean;
    /** Play the `in-` state once on first appearance. */
    intro: boolean;
    speed: number;
    /** Milliseconds; `[main, mid]`. */
    delay: number[];
    /** Pre-built player sequence. Written only when the trigger's own behaviour is not enough. */
    sequence?: string;

    /**
     * Layout and targeting, set from the block's Advanced panel rather than the icon
     * editor. Held here because that is where they have always lived — and because
     * rebuilding this object without them is exactly how they used to get lost.
     */
    display?: 'block' | 'inline-block';
    target?: string | null;
}
