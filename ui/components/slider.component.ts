import { html, LitElement, PropertyValues, TemplateResult, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import CSS from './slider.component.css?raw';
import { classMap } from "lit/directives/class-map.js";

export interface SliderChangeEvent {
    value: number;
}

@customElement('li-slider')
export class SliderComponent extends LitElement {
    @property({ type: Number })
    value: number = 0;

    @property({ type: Number })
    minValue: number = 0;

    @property({ type: Number })
    maxValue: number = 100;

    @property({ type: Boolean })
    fill: boolean = false;

    @query('#slider', true)
    sliderElement?: HTMLElement;

    @query('#knob', true)
    knobElement?: HTMLElement;

    drag: boolean = false;

    updated(changedProperties: PropertyValues) {
        if (changedProperties.has('value') || changedProperties.has('minValue') || changedProperties.has('maxValue')) {
            this.refresh();
        }
    }

    refresh() {
        const p = this.progress;

        this.sliderElement!.style.setProperty(`--fill-scale`, '' + p);
        this.sliderElement!.style.setProperty(`--progress`, `${p * 100}%`);
    }

    firstUpdated() {
        this.initSlider();
        this.refresh();
    }

    initSlider() {
        let startX = 0;
        let knobStartX = 0;

        const onMove = (clientX: number) => {
            const sliderRect = this.sliderElement!.getBoundingClientRect();
            const knobRect = this.knobElement!.getBoundingClientRect();
            const maxRight = sliderRect.width - knobRect.width;
            const deltaX = clientX - startX;
            const left = Math.min(maxRight, Math.max(0, knobStartX + deltaX));
            const value = Math.round((left / maxRight) * (this.maxValue - this.minValue) + this.minValue);

            this.value = Math.max(this.minValue, Math.min(this.maxValue, value));
            this.refresh();
            this.notifyValue();
        };

        const onMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            onMove(e.clientX);
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                onMove(e.touches[0].clientX);
            }
        };

        const endDrag = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', endDrag);
            this.drag = false;
            this.notifyValue();
        };

        const startDrag = (clientX: number) => {
            const sliderRect = this.sliderElement!.getBoundingClientRect();
            const knobRect = this.knobElement!.getBoundingClientRect();
            startX = clientX;
            knobStartX = knobRect.left - sliderRect.left;
            this.drag = true;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', endDrag);
        };

        this.knobElement!.addEventListener('mousedown', (e: MouseEvent) => {
            e.preventDefault();
            startDrag(e.clientX);
        });

        this.knobElement!.addEventListener('touchstart', (e: TouchEvent) => {
            if (e.touches.length > 0) {
                startDrag(e.touches[0].clientX);
            }
        }, { passive: false });
    }

    notifyValue() {
        const event = new CustomEvent<SliderChangeEvent>('change', {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    sliderClick(e: MouseEvent) {
        const p = e.composedPath();

        if (p.length > 0 && p[0] === this.knobElement) {
            return;
        }

        const b = this.sliderElement!.getBoundingClientRect();
        const value = Math.round(
            Math.max(0, Math.min(this.maxValue, ((e.clientX - b.left) / b.width) * this.maxValue)),
        );

        this.value = value;
        this.refresh();
        this.notifyValue();
    }

    render() {
        return html`
            <div id="slider" @mousedown=${this.sliderClick}>
                <div id="line" class=${classMap({ fill: this.fill })}></div>
                <div id="knob"></div>
            </div>
        `;
    }

    get progress(): number {
        return this.value / this.maxValue;
    }

    static styles = unsafeCSS(CSS);
}