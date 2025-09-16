import {
    Element,
    Hover as HoverTrigger,
    In as InTrigger,
    LoopOnHover as LoopOnHoverTrigger,
    Loop as LoopTrigger,
    Morph as MorphTrigger,
    Player,
    Sequence as SequenceTriggerBase,
    Trigger,
} from '@lordicon/element';

class LastFrameTrigger implements Trigger {
    constructor(
        protected player: Player,
        protected element: HTMLElement,
        protected targetElement: HTMLElement,
    ) {
    }

    onReady() {
        const state = this.player.availableStates.find(s => s.name === this.player.state);
        if (state) {
            let framesRatio = 0;
            if (state.params.length) {
                const ratio = parseFloat(state.params[0]);
                if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
                    framesRatio = ratio;
                }
            }

            const frameIndex = framesRatio ? state.duration * framesRatio : state.duration;

            this.player.seek(frameIndex);
        } else {
            this.player.seekToEnd();
        }
    }

    onDisconnected() {
        this.player.seekToStart();
    }
}

export class SequenceTrigger extends SequenceTriggerBase {
    protected timer: any;
    protected pauseDetails?: 'timer' | 'animation' | null;
    protected sequenceIndex: number = 0;
    protected lastAction: string | null = null;
    protected time: Date | null = null;

    constructor(
        protected player: Player,
        protected element: HTMLElement,
        protected targetElement: HTMLElement,
    ) {
        super(player, element, targetElement);
    }

    pause() {
        if (this.timer) {
            this.pauseDetails = 'timer';

            clearTimeout(this.timer);
            this.timer = null;
        } else {
            this.pauseDetails = 'animation';

            this.player.pause();
        }
    }

    play() {
        if (this.pauseDetails === 'animation') {
            this.pauseDetails = null;
            this.player.play();
        } else if (this.pauseDetails === 'timer') {
            this.pauseDetails = null;
            this.step();
        } else {
            this.reset();
            this.step();
        }
    }

    step() {
        if (this.sequenceIndex === 0) {
            this.time = new Date();
        }

        if (this.pauseDetails) {
            return;
        }

        const { action, params } = this.takeStep();

        if (!action) {
            return;
        }

        this.lastAction = action;

        this.handleStep(action, params);
    }

    get playing() {
        return !this.pauseDetails && this.lastAction !== 'idle';
    }

    get progress() {
        const currentTime = new Date().getTime() - this.time!.getTime();
        const p = Math.min(1, currentTime / this.duration);

        return p;
    }

    get duration() {
        return this.element.hasAttribute('duration') ? +(this.element.getAttribute('duration') || 0) : 0;
    }
}

/**
 * Defines the icon element with the provided lottie-web player.
 */
export function defineIconElement() {
    Element.defineTrigger('hover', HoverTrigger);
    Element.defineTrigger('morph', MorphTrigger);
    Element.defineTrigger('sequence', SequenceTrigger);
    Element.defineTrigger('in', InTrigger);
    Element.defineTrigger('loop', LoopTrigger);
    Element.defineTrigger('loop-on-hover', LoopOnHoverTrigger);
    Element.defineTrigger('last-frame', LastFrameTrigger);

    customElements.define('li-icon', Element);
}
