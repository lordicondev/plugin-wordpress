import {
    Element,
    Hover as HoverTrigger,
    In as InTrigger,
    Loop as LoopTrigger,
    LoopOnHover as LoopOnHoverTrigger,
    Morph as MorphTrigger,
    Player,
    Sequence as SequenceTrigger,
    Trigger,
} from '@lordicon/element';

/**
 * Holds the icon on its final frame.
 *
 * Used for the static format, which has no motion to show. A morph state carries a split
 * ratio in its first parameter — the boundary between its enter and leave halves — and the
 * frame to rest on is that boundary rather than the very end.
 *
 * Small enough to keep here. The equivalent lives in `@lordicon/triggers`, but that package
 * is private, and depending on it would make the build instructions in readme.txt untrue for
 * anyone outside Lordicon while the same code ships compiled into dist/ anyway.
 */
class LastFrameTrigger implements Trigger {
    constructor(
        protected player: Player,
        protected element: HTMLElement,
        protected targetElement: HTMLElement,
    ) {
    }

    onReady() {
        const state = this.player.availableStates.find(s => s.name === this.player.state);

        if (!state) {
            this.player.seekToEnd();
            return;
        }

        let framesRatio = 0;
        if (state.params.length) {
            const ratio = parseFloat(state.params[0]);
            if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
                framesRatio = ratio;
            }
        }

        this.player.seek(framesRatio ? state.duration * framesRatio : state.duration);
    }

    onDisconnected() {
        this.player.seekToStart();
    }
}

/**
 * Registers the `li-icon` custom element used across the editor sidebar and the settings
 * screen.
 *
 * The trigger set is the element's own, which is the point: the preview drives `li-icon`
 * exactly as `Plugin::render_block()` drives `<lord-icon>` on the published page, so the two
 * cannot behave differently. `last-frame` is the only addition, and it exists for a format
 * that has no animation at all.
 */
export function defineIconElement() {
    Element.defineTrigger('in', InTrigger);
    Element.defineTrigger('hover', HoverTrigger);
    Element.defineTrigger('morph', MorphTrigger);
    Element.defineTrigger('loop', LoopTrigger);
    Element.defineTrigger('loop-on-hover', LoopOnHoverTrigger);
    Element.defineTrigger('sequence', SequenceTrigger);
    Element.defineTrigger('last-frame', LastFrameTrigger);

    customElements.define('li-icon', Element);
}
