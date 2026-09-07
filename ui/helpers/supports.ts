import { IconState } from '@lordicon/utils-lottie';
import { ExportFormat } from '../types';
import { parseTrigger } from './animation';

/**
 * Capabilities of the selected format. Each flag says whether the corresponding editor
 * control is relevant. Ported from the portal's `utils/supports.ts` and narrowed to the two
 * things WordPress can insert.
 */
export interface FormatSupports {
    /** Format carries motion rather than a single frame. */
    animation: boolean;
    /** Animation settings (playback, speed, delay) can be configured. */
    animationSettings: boolean;
    /** Playback mode applies. */
    playback: boolean;
    /** Icon states are relevant (needs an icon that has more than one). */
    states: boolean;
    /** Colour overrides are supported. */
    colors: boolean;
    /** Stroke width can be adjusted. */
    stroke: boolean;
    /** Display size can be configured. */
    size: boolean;
    /** Format loops naturally, which decides the playback defaults. */
    loop: boolean;
}

/**
 * Computes which editor capabilities are available for a format and icon.
 *
 * `json` is a live player, so everything applies. `svg` is one frame of artwork: it still
 * takes a state, colours and stroke — `customizeSvg` applies all three to a pack — but
 * nothing about motion.
 *
 * @param format - Currently selected format.
 * @param hasColors - Whether the icon exposes customisable colours.
 * @param hasStroke - Whether the icon exposes a stroke property.
 * @param hasStates - Whether the icon has more than one animation state.
 */
export function computeSupports(
    format: ExportFormat,
    hasColors: boolean,
    hasStroke: boolean,
    hasStates = false,
): FormatSupports {
    const animation = format === 'json';

    return {
        animation,
        animationSettings: animation,
        playback: animation,
        states: hasStates,
        colors: hasColors,
        stroke: hasStroke,
        size: true,
        loop: animation,
    };
}

/**
 * Whether an intro animation can be prepended.
 *
 * `intro` is an attribute on `<lord-icon>`: the element plays the icon's `in-` state once
 * when it first appears, then hands over to the trigger. It therefore needs an `in-` state
 * to exist, and only makes sense ahead of a trigger the intro can lead into.
 *
 * Note the published page pays for it: with `intro` set, `render_block()` drops the static
 * placeholder and switches loading from `interaction` to `lazy`, because a placeholder
 * would be visible for a moment before the intro replaced it.
 *
 * @param format - Currently selected format.
 * @param state - Selected state name.
 * @param states - All states the icon declares.
 */
export function supportsIntro(format: ExportFormat, state: string, states: IconState[]): boolean {
    if (format !== 'json') {
        return false;
    }

    if (!states.some((c) => c.name.startsWith('in-'))) {
        return false;
    }

    return ['hover', 'morph'].includes(parseTrigger(state));
}
