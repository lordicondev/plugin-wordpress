import { readStates } from '@lordicon/utils-lottie';
import { AnimationPlayback, AnimationTrigger, SectionInterface } from '../types';

/**
 * Playback sequence builder, ported from the portal
 * (`assets/src/scripts/features/library/utils/animation.ts`) and identical to the Figma
 * plugin's copy. The three must not drift: a sequence string produced here has to describe
 * the same motion as the same icon exported from lordicon.com.
 *
 * One thing is deliberately *not* shared. `frameSequence` picks the end frame (or a morph's
 * split point) because a static export should show the icon in its finished pose. WordPress
 * never calls it: its static SVG is a *placeholder* that sits under a live animation until
 * the visitor interacts, so it has to show frame 0 — the resting pose the animation starts
 * from. Anything else would make the icon jump the moment it comes alive.
 */

export const SUPPORTED_TRIGGERS: AnimationTrigger[] = ['in', 'hover', 'morph', 'loop'];

/**
 * Determines the appropriate animation playback type based on the trigger and loop support.
 * @param trigger - The animation trigger type.
 * @param supportsLoop - Whether the target format can loop.
 * @returns The default playback type for that combination.
 */
export function animationPlayback(
    trigger: AnimationTrigger,
    supportsLoop: boolean,
): AnimationPlayback {
    if (trigger === 'loop') {
        return supportsLoop ? 'continuous' : 'once';
    } else if (trigger === 'in') {
        return 'once';
    } else if (trigger === 'hover') {
        return supportsLoop ? 'continuous' : 'once';
    } else if (trigger === 'morph') {
        return supportsLoop ? 'continuous' : 'boomerang';
    }

    return 'once';
}

/**
 * Returns the playback types available for the given trigger and loop support.
 * Single source of truth shared by the playback-type select options and by the editor when
 * validating carried-over playback values — a playback stored for one trigger group (a
 * morph-only 'boomerang', say) must not be applied to another.
 * @param trigger - The animation trigger type.
 * @param supportsLoop - Whether the target format can loop.
 * @returns The playback types selectable for this trigger.
 */
export function availablePlaybacks(
    trigger: AnimationTrigger,
    supportsLoop: boolean,
): AnimationPlayback[] {
    const result: AnimationPlayback[] = [];

    if (trigger !== 'loop' || !supportsLoop) {
        result.push('once');
    }

    if (trigger === 'in' || trigger === 'morph') {
        result.push('reverse');
    }

    if (trigger === 'morph') {
        result.push('boomerang');
    }

    if (supportsLoop) {
        result.push('continuous');
    }

    return result;
}

/**
 * Determines the default animation delay for a trigger type.
 * @param trigger - The animation trigger type.
 * @returns Delays in milliseconds; `[0]` is the main pause, `[1]` the mid-cycle one.
 */
export function triggerDelay(trigger: AnimationTrigger): number[] {
    const result: number[] = [];

    if (trigger === 'morph') {
        result.push(1000);
        result.push(1000);
    } else if (trigger === 'in') {
        result.push(500);
    } else if (trigger === 'hover') {
        result.push(1000);
    }

    return result;
}

/**
 * Prepares the trigger type based on the state string.
 * @param state - The state name, e.g. `hover-locked`.
 * @returns The trigger the state belongs to; `hover` when the prefix is unknown.
 */
export function parseTrigger(state: string): AnimationTrigger {
    const [firstPart] = state.split('-');

    if (SUPPORTED_TRIGGERS.includes(firstPart as AnimationTrigger)) {
        return firstPart as AnimationTrigger;
    }

    return 'hover';
}

/**
 * Builds a single-frame seek sequence for the given icon data.
 * When `params.frame` is provided the sequence seeks to that absolute frame. Otherwise the
 * active state's end frame — or the split-ratio midpoint, for a morph — is used, which is
 * what makes a static export of a morph state show the "entered" artwork.
 * @param iconData - Raw Lottie icon data.
 * @param params - Optional state name and/or explicit frame number.
 * @returns Object containing the player sequence string.
 */
export function frameSequence(
    iconData: any,
    params: {
        state?: string;
        frame?: number;
    } = {},
): {
    sequence: string;
} {
    if (params.frame !== undefined) {
        return { sequence: `frame:${params.frame}` };
    }

    const states = readStates(iconData);
    const stateName = params.state || '';
    const state =
        states.find((c) => c.name === stateName) || states.find((c) => c.default) || states[0];

    let framesRatio = 0;
    if (state.params.length) {
        const ratio = parseFloat(state.params[0]);
        if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
            framesRatio = ratio;
        }
    }

    const frame = framesRatio ? state.duration * framesRatio : state.duration;

    return {
        sequence: `frame:${frame}`,
    };
}

/**
 * Builds an interactive playback sequence for a specific animation state and playback mode.
 *
 * For the `morph` trigger two variants are supported:
 * - **Split-ratio**: when `state.params[0]` holds a ratio (e.g. `"0.5"`), the animation is
 *   split at that proportional frame. The first portion is the *enter* segment, the second
 *   the *leave* segment. Each is addressed via `frame:start:end`.
 * - **Direction-based**: no params — the full animation plays forward on enter and in
 *   reverse on leave, using `play` / `play:reverse`.
 *
 * `playback` controls what portion is included:
 * - `once` → enter only
 * - `reverse` → leave only (or a full reverse pass for the direction-based variant)
 * - `boomerang` / `continuous` → full enter→leave cycle; `continuous` omits the trailing `idle`
 *
 * The main delay (`delay[0]`) is a lead-in only for `in`; for `hover` and `morph` it is heard
 * *after* the animation, so the icon starts moving immediately and the pause closes the loop.
 * The grammar has no standalone pause — see `pushDelayToken` for why a trailing delay is
 * still written before the segment it follows.
 *
 * @param iconData - Raw Lottie icon data.
 * @param params - State name, playback mode, per-trigger delays (ms), and speed multiplier.
 * @returns Sequence string and annotated sections describing each segment.
 */
export function animationSequence(
    iconData: any,
    params: {
        state: string;
        playback: AnimationPlayback;
        delay?: number[];
        speed?: number;
    },
): {
    sequence: string;
    sections: SectionInterface[];
} {
    const states = readStates(iconData);
    const frameRate = iconData?.fr ?? 30;
    const stateName = params.state ?? '';
    const state =
        states.find((c) => c.name === stateName) || states.find((c) => c.default) || states[0];
    const playback = params.playback;
    const delay = params.delay ?? [];
    const speed = params.speed ?? 1;
    const trigger = parseTrigger(state?.name ?? stateName);

    if (!state) {
        throw new Error('State not found');
    }

    const sequenceParts: string[] = [];
    const sections: SectionInterface[] = [];

    const parseDuration = (duration?: number) => {
        return ((duration || 0) / frameRate) * 1000 * (1 / speed);
    };

    /**
     * Emits a delay token. The grammar has no standalone pause: `delay:N` attaches the hold
     * to the *first* frame of the segment that follows and `delay:N:last` to its last one. A
     * pause meant to be heard after an animation therefore still has to be written before it
     * — a `delay` appended at the end of a sequence is never consumed and is silently ignored.
     * @param value - Pause length in ms; zero emits nothing.
     * @param trailing - Pin the hold to the last frame of the following segment.
     */
    const pushDelayToken = (value: number, trailing?: boolean) => {
        if (value) {
            sequenceParts.push(trailing ? `delay:${value}:last` : `delay:${value}`);
        }
    };

    /**
     * Records a delay in `sections`. Kept separate from the token because `sections` describes
     * the timeline as the viewer perceives it, so a trailing delay is appended *after* the
     * segment it follows — the opposite order from the sequence string.
     * @param value - Pause length in ms; zero records nothing.
     */
    const pushDelaySection = (value: number) => {
        if (value) {
            sections.push({
                duration: value,
                animation: false,
                ratio: 0,
                title: 'Delay',
            });
        }
    };

    /**
     * Emits a playback segment and its matching section.
     * @param token - Sequence token (`play`, `play:reverse` or `frame:start:end`).
     * @param title - Section label shown on the timeline.
     * @param duration - Segment length in ms.
     */
    const pushPlay = (token: string, title: string, duration: number) => {
        sequenceParts.push(token);
        sections.push({
            duration,
            animation: true,
            ratio: 0,
            title,
        });
    };

    if (states.length > 1 && state.name) {
        sequenceParts.push(`state:${state.name}`);
    }

    if (trigger === 'in') {
        const delayFirst = delay?.[0] ?? 0;

        pushDelayToken(delayFirst);
        pushDelaySection(delayFirst);

        if (playback === 'reverse') {
            pushPlay('play:reverse', 'Play reverse', parseDuration(state?.duration));
        } else {
            pushPlay('play', 'Play', parseDuration(state?.duration));
        }

        if (playback !== 'continuous') {
            sequenceParts.push('idle');
        }
    } else if (trigger === 'hover') {
        const delayFirst = delay?.[0] ?? 0;

        pushDelayToken(delayFirst, true);
        pushPlay('play', 'Play', parseDuration(state?.duration));
        pushDelaySection(delayFirst);

        if (playback !== 'continuous') {
            sequenceParts.push('idle');
        }
    } else if (trigger === 'morph') {
        const delayFirst = delay?.[0] ?? 0;
        const delaySecond = delay?.[1] ?? 0;

        // Detect split-ratio: params[0] encodes the proportional boundary between enter and leave.
        const splitRatio = state.params?.length ? parseFloat(state.params[0]) : NaN;
        const hasSplitRatio = !isNaN(splitRatio) && splitRatio > 0 && splitRatio < 1;

        // The split-ratio variant addresses the two halves via `frame:start:end`; the
        // direction-based one replays the whole state forwards and backwards. Only the
        // segment tokens differ.
        const splitFrame = hasSplitRatio ? Math.floor((state.duration + 1) * splitRatio) : 0;

        const enterToken = hasSplitRatio ? `frame:0:${splitFrame}` : 'play';
        const leaveToken = hasSplitRatio ? `frame:${splitFrame}:${state.duration}` : 'play:reverse';
        const enterTitle = hasSplitRatio ? 'Play enter' : 'Play';
        const leaveTitle = hasSplitRatio ? 'Play leave' : 'Play reverse';
        const enterDuration = parseDuration(hasSplitRatio ? splitFrame : state?.duration);
        const leaveDuration = parseDuration(
            hasSplitRatio ? state.duration - splitFrame : state?.duration,
        );

        if (playback === 'once') {
            pushDelayToken(delayFirst, true);
            pushPlay(enterToken, enterTitle, enterDuration);
            pushDelaySection(delayFirst);
        } else if (playback === 'reverse') {
            // Only the leave half — returns the icon to its resting state.
            pushDelayToken(delayFirst, true);
            pushPlay(leaveToken, leaveTitle, leaveDuration);
            pushDelaySection(delayFirst);
        } else {
            // boomerang / continuous: enter, pause, leave, closing pause.
            pushPlay(enterToken, enterTitle, enterDuration);

            // Both pauses attach to the leave segment: the mid one to its first frame, the
            // main one to its last. Two `delay` tokens in a row set independent slots.
            pushDelayToken(delaySecond);
            pushDelaySection(delaySecond);
            pushDelayToken(delayFirst, true);

            pushPlay(leaveToken, leaveTitle, leaveDuration);
            pushDelaySection(delayFirst);
        }

        if (playback !== 'continuous') {
            sequenceParts.push('idle');
        }
    } else if (trigger === 'loop') {
        pushPlay('play', 'Play', parseDuration(state?.duration));

        if (playback !== 'continuous') {
            sequenceParts.push('idle');
        }
    } else {
        throw new Error('Unsupported trigger');
    }

    // Update ratios.
    const totalDuration = sections.reduce((acc, section) => acc + section.duration, 0);
    sections.forEach((section) => {
        section.ratio = totalDuration ? section.duration / totalDuration : 0;
    });

    return {
        sequence: sequenceParts.join(','),
        sections,
    };
}

/**
 * Removes 'idle' (with or without parameters) from the animation sequence string.
 * The offline renderer rejects the token — it only means something to a live player — so an
 * export path has to strip it, and its presence is exactly what says "play once".
 * @param sequence - The animation sequence string.
 * @returns A tuple: [sequence without idle, whether idle was present]
 */
export function stripIdleFromSequence(sequence: string): [string, boolean] {
    const strippedSequence = sequence.replace(/,?(idle(:\w+)?)(?=,|$)/, '');
    const hadIdle = strippedSequence !== sequence;

    return [strippedSequence, hadIdle];
}
