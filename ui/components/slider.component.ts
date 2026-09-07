import { html, LitElement, PropertyValues, TemplateResult, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import CSS from './slider.component.css?raw';

export interface SliderChangeEvent {
    value: number;
}

/**
 * Slider. Ported from the portal's `ui/components/slider.component.ts`.
 *
 * Not a native `<input type="range">`: the track has to carry a fill and, in the editor, a
 * slot for section markers. Drag listeners live on `window` so a pointer leaving the 300px
 * panel mid-drag still reaches us.
 */
@customElement('li-slider')
export class SliderComponent extends LitElement {
    @property({ type: Number })
    value: number = 0;

    @property({ type: Number })
    min: number = 0;

    @property({ type: Number })
    max: number = 100;

    @property({ type: Number })
    step: number = 1;

    @property({ type: Boolean, reflect: true })
    fill: boolean = false;

    @query('#slider', true)
    sliderElement?: HTMLElement;

    @query('#knob', true)
    knobElement?: HTMLElement;

    private drag: boolean = false;

    /**
     * Whether the user is currently dragging the knob.
     *
     * Read-only on purpose: something driving the slider from outside (playback position, for
     * one) has to know when to stop writing `value`, or it fights the drag — but nothing
     * outside may declare a drag started.
     */
    get dragging(): boolean {
        return this.drag;
    }

    private readonly onMouseMoveBound = this.onMouseMove.bind(this);
    private readonly onMouseUpBound = this.stopDrag.bind(this);
    private readonly onTouchMoveBound = this.onTouchMove.bind(this);
    private readonly onTouchEndBound = this.stopDrag.bind(this);

    updated(changedProperties: PropertyValues) {
        if (changedProperties.has('value') || changedProperties.has('min') || changedProperties.has('max')) {
            this.refresh();
        }
    }

    firstUpdated() {
        this.refresh();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.cleanupDragListeners();
    }

    refresh() {
        const p = this.progress;

        this.sliderElement!.style.setProperty(`--li-slider-fill-ratio`, '' + p);
        this.sliderElement!.style.setProperty(`--li-slider-knob-position`, `${p * 100}%`);
    }

    /**
     * Maps a clientX coordinate to a stepped value within [min, max].
     */
    private getValueFromClientX(clientX: number): number {
        const rect = this.sliderElement!.getBoundingClientRect();
        const range = this.max - this.min;
        const raw = this.min + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * range;

        return Math.max(this.min, Math.min(this.max, this.snapToStep(raw)));
    }

    private onMouseDown(e: MouseEvent) {
        e.preventDefault();
        this.drag = true;
        this.value = this.getValueFromClientX(e.clientX);
        this.refresh();
        this.notifyValue();
        window.addEventListener('mousemove', this.onMouseMoveBound);
        window.addEventListener('mouseup', this.onMouseUpBound);
    }

    private onTouchStart(e: TouchEvent) {
        if (e.cancelable) e.preventDefault();
        this.drag = true;
        const touch = e.touches[0] || e.changedTouches[0];
        this.value = this.getValueFromClientX(touch.clientX);
        this.refresh();
        this.notifyValue();
        window.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
        window.addEventListener('touchend', this.onTouchEndBound);
        window.addEventListener('touchcancel', this.onTouchEndBound);
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.drag) return;
        this.value = this.getValueFromClientX(e.clientX);
        this.refresh();
        this.notifyValue();
    }

    private onTouchMove(e: TouchEvent) {
        if (!this.drag) return;
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        this.value = this.getValueFromClientX(touch.clientX);
        this.refresh();
        this.notifyValue();
    }

    private stopDrag() {
        if (!this.drag) return;
        this.cleanupDragListeners();
        this.notifyValue();
    }

    /**
     * Removes global drag listeners and resets drag state. Safe when no drag is active.
     */
    private cleanupDragListeners() {
        if (!this.drag) return;
        this.drag = false;
        window.removeEventListener('mousemove', this.onMouseMoveBound);
        window.removeEventListener('mouseup', this.onMouseUpBound);
        window.removeEventListener('touchmove', this.onTouchMoveBound);
        window.removeEventListener('touchend', this.onTouchEndBound);
        window.removeEventListener('touchcancel', this.onTouchEndBound);
    }

    notifyValue() {
        this.dispatchEvent(new CustomEvent<SliderChangeEvent>('change', {
            detail: { value: this.value },
        }));
    }

    /**
     * Snaps a raw value to the nearest step, preserving decimal precision.
     */
    private snapToStep(value: number): number {
        const steps = Math.round((value - this.min) / this.step);
        const snapped = this.min + steps * this.step;
        const precision = (this.step.toString().split('.')[1] ?? '').length;

        return parseFloat(snapped.toFixed(precision));
    }

    get progress(): number {
        const range = this.max - this.min;

        return range === 0 ? 0 : (this.value - this.min) / range;
    }

    render() {
        let fill: TemplateResult | null = null;

        if (this.fill) {
            fill = html`<div id="fill"></div>`;
        }

        return html`
            <div id="slider" @mousedown=${this.onMouseDown} @touchstart=${this.onTouchStart}>
                <div id="bar">
                    <slot>
                        <div id="line"></div>
                        ${fill}
                    </slot>
                </div>
                <div id="knob"></div>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}
