import { AnimationPlayback, AnimationSettings, AnimationTrigger, BlockProperties } from '../types';
import { availablePlaybacks, parseTrigger, triggerDelay } from './animation';

/**
 * Translation between the editor's animation model and the block attribute that is
 * persisted into post content.
 *
 * The persisted shape is a public contract with instances in every post ever built with
 * this plugin, so it grew rather than changed: `playback` was added, `loop` and `intro`
 * stayed. Everything that reads or writes that pairing goes through this file, so the rule
 * lives in one place instead of being re-derived at each call site.
 */

/**
 * The playback a state starts on.
 *
 * Deliberately not the portal's `animationPlayback()`, which answers `continuous` for hover
 * and morph. That is right where an icon is exported as one finished animation; here the
 * icon stays alive on the page, so the default has to be the trigger's own behaviour —
 * hover plays on hover, a morph enters and leaves with the pointer. Looping is something you
 * ask for, not something you get.
 *
 * A `loop` state is the exception: repeating is what it is for, and it is the only mode
 * offered for it.
 *
 * @param trigger - Trigger the selected state belongs to.
 */
export function wordpressPlayback(trigger: AnimationTrigger): AnimationPlayback {
    return trigger === 'loop' ? 'continuous' : 'once';
}

/**
 * Playback modes a published WordPress page offers.
 *
 * Two, where the portal has four — and they are exactly the two positions the old loop
 * switch had, now named for what they do.
 *
 * `reverse` is withheld because expressing it would mean a sequence, and a sequence replaces
 * the trigger: `render_block()` sets `trigger="sequence"` whenever one is present, the
 * shipped sequence trigger starts in `onReady()` — on page load, with no interaction — and an
 * `idle` step halts it permanently with no way for a visitor to restart it. An icon frozen
 * after one pass is worse than the mode it would replace.
 *
 * `boomerang` is withheld for a different reason: the element does have such a trigger, but
 * `morph` already covers morph states completely — it plays the enter half on hover and the
 * leave half when the pointer goes away, which is the interaction people expect from these
 * icons. Offering a second, subtly different motion for the same states buys confusion.
 *
 * @param trigger - Trigger the selected state belongs to.
 * @param supportsLoop - Whether the selected format can loop.
 * @returns Selectable playback modes, in the portal's order.
 */
export function wordpressPlaybacks(
    trigger: AnimationTrigger,
    supportsLoop: boolean,
): AnimationPlayback[] {
    return availablePlaybacks(trigger, supportsLoop)
        .filter((playback) => playback === 'once' || playback === 'continuous');
}

/**
 * Whether the chosen playback needs a pre-built sequence to reach the page.
 *
 * A sequence overrides the element's own trigger, so it is written only when the trigger
 * cannot express the playback by itself. `loop` states have always carried one.
 *
 * @param playback - Chosen playback mode.
 * @param trigger - Trigger the selected state belongs to.
 */
export function needsSequence(playback: AnimationPlayback, trigger: AnimationTrigger): boolean {
    return playback === 'continuous' || trigger === 'loop';
}

/**
 * Reads the playback mode out of stored properties.
 *
 * Blocks saved before `playback` existed only recorded `loop`, which had exactly two
 * positions — so the fallback is total, and an old block always resolves to a mode that
 * describes what it used to do. Values that do not apply to the state's trigger are
 * rejected: a `boomerang` carried over from a morph must not survive onto a hover.
 *
 * @param properties - Stored block properties, possibly partial or legacy.
 * @param supportsLoop - Whether the selected format can loop.
 * @returns The playback mode to edit with.
 */
export function readPlayback(
    properties: Partial<BlockProperties> | undefined,
    supportsLoop: boolean,
): AnimationPlayback {
    const trigger = parseTrigger(properties?.state ?? '');
    const available = wordpressPlaybacks(trigger, supportsLoop);

    const stored = properties?.playback;
    if (stored && available.includes(stored)) {
        return stored;
    }

    // Legacy: `loop` was the whole model.
    if (properties?.loop !== undefined) {
        const derived: AnimationPlayback = properties.loop ? 'continuous' : 'once';
        if (available.includes(derived)) {
            return derived;
        }
    }

    return wordpressPlayback(trigger);
}

/**
 * Produces the animation half of the persisted properties.
 *
 * Writes `playback` and its legacy mirrors together. `loop` is what an older copy of the
 * plugin — or an older cached copy of the front-end PHP — would read, so keeping it
 * accurate is what makes a downgrade safe rather than silently wrong.
 *
 * @param settings - The editor's current animation settings.
 * @returns The `playback` / `loop` / `intro` / `speed` / `delay` fields.
 */
export function writeAnimation(settings: AnimationSettings): Pick<
    BlockProperties,
    'playback' | 'loop' | 'intro' | 'speed' | 'delay'
> {
    const playback = settings.playback ?? 'once';

    return {
        playback,
        loop: playback === 'continuous',
        intro: settings.intro ?? false,
        speed: settings.speed ?? 1,
        delay: settings.delay ?? [],
    };
}

/**
 * Default animation settings for a state.
 * @param state - State name, e.g. `hover-pinch`.
 * @param supportsLoop - Whether the selected format can loop.
 */
export function defaultAnimation(state: string): Required<
    Pick<AnimationSettings, 'playback' | 'speed' | 'delay' | 'intro'>
> {
    const trigger = parseTrigger(state);
    const playback = wordpressPlayback(trigger);

    return {
        playback,
        speed: 1,
        // The portal's per-trigger delays are pauses inside a loop, which is what they are
        // here too. An interactive icon should answer the pointer at once, so it starts
        // without one — the control is still there for anyone who wants a lead-in.
        delay: playback === 'continuous' ? triggerDelay(trigger) : [],
        intro: false,
    };
}
