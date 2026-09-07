import { html, LitElement, TemplateResult, unsafeCSS } from "lit";
import { customElement, property, state } from 'lit/decorators.js';
import { Async, throttle, TIME_OUT_AFTER } from '../helpers';
import { AnimationPlayback, AnimationTrigger, ExportFormat } from '../types';
import CSS from './animation-settings.component.css?raw';

/** Full animation settings emitted on any change within the component. */
export interface AnimationSettingsChangeEvent {
    playback: AnimationPlayback;
    delay: number[];
    speed: number;
    intro: boolean;
}

const MIN_DELAY = 0;
const MAX_DELAY = 5;
const DELAY_STEP = 0.1;

const MIN_SPEED = 0.1;
const MAX_SPEED = 3;
const SPEED_STEP = 0.1;

/**
 * Dragging a slider fires on every pointer move; the editor re-renders the preview and rebuilds
 * the sequence on each one, so the stream is thinned before it leaves this component.
 */
const THROTTLE_DELAY = 200;

/**
 * Playback settings, as a collapsible panel under the state grid — replacing the gear icon
 * and popover this plugin used to carry, with the same controls in the same order.
 *
 * Looping is a switch rather than a picker. Internally it is a playback mode, because that is
 * what gets persisted and what tells `once` and `continuous` apart; but with two positions
 * the mode *is* a boolean, and a switch is what this panel always had.
 *
 * Delays travel in milliseconds — that is what the sequence grammar speaks — and are edited in
 * seconds, which is what a person reading "1.5 sec" expects. The conversion happens at both
 * edges of this component and nowhere else.
 */
@customElement('li-animation-settings')
export class AnimationSettingsComponent extends LitElement {
    @property({ type: String })
    trigger: AnimationTrigger = 'hover';

    @property({ type: Boolean })
    supportsLoop = true;

    @property({ type: String })
    playback: AnimationPlayback = 'continuous';

    /** Delays in milliseconds, as the sequence builder wants them. */
    @property({ type: Array })
    delay: number[] = [];

    @property({ type: Number })
    speed = 1;

    @property({ type: Boolean })
    intro = false;

    /**
     * Whether an intro animation is available. Decided by the editor page, which knows
     * whether the icon actually declares an `in-` state.
     */
    @property({ type: Boolean })
    canUseIntro = false;

    @property({ type: String })
    format: ExportFormat = 'json';

    /**
     * Panel open state. Component-local and deliberately not persisted: it describes what the
     * user is looking at right now, not how they want icons exported.
     */
    @state()
    private open = false;

    /** First delay, in seconds, for the fields. */
    @state()
    private delayFirst = 0;

    /** Second delay, in seconds. Morph only. */
    @state()
    private delaySecond = 0;

    private notifyChangeThrottler?: Async;

    willUpdate(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('delay')) {
            this.delayFirst = (this.delay?.[0] ?? 0) / 1000;
            this.delaySecond = (this.delay?.[1] ?? 0) / 1000;
        }
    }

    private toggleOpen() {
        this.open = !this.open;
    }

    private handleHeaderKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleOpen();
        }
    }

    /**
     * Emits the whole settings object. Always reads the latest state, since the throttler may
     * run it after several changes have landed.
     */
    private readonly notifyChange = () => {
        const delay = this.supportsSecondDelay
            ? [this.delayFirst * 1000, this.delaySecond * 1000]
            : [this.delayFirst * 1000];

        this.dispatchEvent(new CustomEvent<AnimationSettingsChangeEvent>('change', {
            detail: {
                playback: this.playback,
                delay,
                speed: this.speed,
                intro: this.intro,
            },
        }));
    };

    private scheduleNotifyChange() {
        this.notifyChangeThrottler = throttle(
            this.notifyChangeThrottler,
            TIME_OUT_AFTER(THROTTLE_DELAY),
            this.notifyChange,
        );
    }

    private handleLoopChange(e: CustomEvent<{ value: boolean }>) {
        e.stopPropagation();
        this.playback = e.detail.value ? 'continuous' : 'once';
        this.scheduleNotifyChange();
    }

    private handleDelayChange(e: CustomEvent<{ value: number | string }>) {
        e.stopPropagation();
        this.delayFirst = Number(e.detail.value);
        this.scheduleNotifyChange();
    }

    private handleDelayMorphChange(e: CustomEvent<{ value: number | string }>) {
        e.stopPropagation();
        this.delaySecond = Number(e.detail.value);
        this.scheduleNotifyChange();
    }

    private handleSpeedChange(e: CustomEvent<{ value: number | string }>) {
        e.stopPropagation();
        this.speed = Number(e.detail.value);
        this.scheduleNotifyChange();
    }

    private handleIntroChange(e: CustomEvent<{ value: boolean }>) {
        e.stopPropagation();
        this.intro = e.detail.value;
        this.scheduleNotifyChange();
    }

    /**
     * One row of the parameter grid: label, slider and numeric field bound to one handler.
     */
    private renderParameter(
        label: string,
        value: number,
        options: { min: number, max: number, step: number, suffix: string },
        handler: (e: CustomEvent<{ value: number | string }>) => void,
    ): TemplateResult {
        return html`
            <li-label class="gray sm">${label}</li-label>
            <li-slider
                fill
                .value=${value}
                .min=${options.min}
                .max=${options.max}
                .step=${options.step}
                @change=${handler}
            ></li-slider>
            <li-field class="sm frame">
                <li-input
                    .value=${value}
                    .min=${options.min}
                    .max=${options.max}
                    .step=${options.step}
                    type="number"
                    suffix=${options.suffix}
                    @change=${handler}
                ></li-input>
            </li-field>
        `;
    }

    private renderBody(): TemplateResult {
        const delayOptions = { min: MIN_DELAY, max: MAX_DELAY, step: DELAY_STEP, suffix: 'sec' };

        const loopField = this.supportsLoopSwitch ? html`
            <div class="field-group row">
                <li-label class="gray sm">Loop</li-label>
                <li-switch .value=${this.looping} @change=${this.handleLoopChange}></li-switch>
            </div>
        ` : null;

        const introField = this.supportsIntro ? html`
            <div class="field-group row">
                <li-label class="gray sm">Include intro animation</li-label>
                <li-switch .value=${this.intro} @change=${this.handleIntroChange}></li-switch>
            </div>
        ` : null;

        const parameters = html`
            <div class="field-col">
                ${this.supportsFirstDelay
                    ? this.renderParameter('Delay', this.delayFirst, delayOptions, this.handleDelayChange)
                    : null}
                ${this.supportsSecondDelay
                    ? this.renderParameter('Delay before return', this.delaySecond, delayOptions, this.handleDelayMorphChange)
                    : null}
                ${this.renderParameter(
                    'Speed',
                    this.speed,
                    { min: MIN_SPEED, max: MAX_SPEED, step: SPEED_STEP, suffix: 'x' },
                    this.handleSpeedChange,
                )}
            </div>
        `;

        return html`
            <div class="body">
                ${introField}
                ${loopField}
                ${parameters}
            </div>
        `;
    }

    render() {
        // Rendered conditionally rather than hidden with CSS, so a collapsed panel holds no
        // sliders that could still answer a stray event.
        const body = this.open ? this.renderBody() : null;

        return html`
            <div class="accordion">
                <div
                    class="header"
                    role="button"
                    tabindex="0"
                    aria-expanded=${this.open}
                    @click=${this.toggleOpen}
                    @keydown=${this.handleHeaderKeydown}
                >
                    <li-label class="gray sm">Advanced settings</li-label>
                    <li-pictogram class=${this.open ? 'rotated' : ''} icon="arrowDown"></li-pictogram>
                </div>
                ${body}
            </div>
        `;
    }

    /**
     * Playback applies to the live Lottie. The static format has no motion to configure.
     */
    get supportsPlayback() {
        return this.format === 'json';
    }

    /** Whether the icon is set to repeat. */
    get looping() {
        return this.playback === 'continuous';
    }

    /**
     * Looping is offered where the trigger has something to repeat and a choice to make. An
     * `in` state plays once by definition and a `loop` state repeats already — for both, a
     * switch would have only one honest position.
     *
     * Mutually exclusive with the intro: a looping icon is driven by a sequence, and the
     * sequence trigger is the one trigger that does not read the `intro` attribute.
     */
    get supportsLoopSwitch() {
        return this.supportsPlayback
            && !this.intro
            && ['hover', 'morph'].includes(this.trigger);
    }

    /**
     * The panel's full set, by trigger — the same one this plugin has always shown:
     *
     * - `in`    speed
     * - `hover` intro, loop, speed (+ delay while looping)
     * - `morph` intro, loop, speed (+ delay and delay-before-return while looping)
     * - `loop`  speed
     */

    /**
     * A delay is a pause inside the loop, so it only exists once the icon is looping — which
     * also means it only exists where the loop switch does.
     */
    get supportsFirstDelay() {
        return this.supportsLoopSwitch && this.looping;
    }

    /**
     * The mid-cycle pause needs two segments to sit between, which is a looping morph — the
     * one case expressed as a sequence with an enter and a leave half.
     */
    get supportsSecondDelay() {
        return this.supportsFirstDelay && this.trigger === 'morph';
    }

    get supportsIntro() {
        return this.canUseIntro && !this.looping;
    }


    static styles = unsafeCSS(CSS);
}
