import { Element as LordIconElement } from '@lordicon/element';
import { html, LitElement, PropertyValues, TemplateResult, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { isDarkColor, isLightColor, Progress } from "../helpers";
import { PictogramComponent } from "./pictogram.component";
import CSS from './preview.component.css?raw';
import { SliderSectionsComponent } from './slider-sections.component';
import { SliderComponent } from "./slider.component";

const DEFAULT_STROKE = 2;

/**
 * Parses a duration in milliseconds to a string format.
 * @param duration Duration in milliseconds.
 */
function parseDuration(duration: number): string {
    let v = duration / 1000;
    v = Math.round(v * 10) / 10;

    return `${v}s`;
}

@customElement('li-preview')
export class PreviewComponent extends LitElement {
    @query('li-icon', true)
    iconElement?: LordIconElement;

    @query('li-slider,li-slider-sections', false)
    sliderElement?: SliderComponent | SliderSectionsComponent;

    @query('li-pictogram', false)
    playElement?: PictogramComponent;

    @property({ type: Object })
    icon: any;

    @property()
    sequence: string = '';

    @property()
    background: string = '';

    @property()
    stroke: number = DEFAULT_STROKE;

    @property()
    state: string = '';

    @property()
    trigger: string = '';

    @property({ type: Array })
    colors: any[] = [];

    @property({ type: Array })
    sections: any[] = [];

    @property({ type: String })
    format: 'svg' | 'json' = 'json';

    @property()
    duration: number = 0;

    @property()
    speed: number = 1;

    @property()
    delay: number = 0;

    @property()
    intro: boolean = false;

    @property()
    loop: boolean = false;

    progress: Progress | null = null;

    disconnectedCallback(): void {
        this.stopProgress();

        super.disconnectedCallback();
    }

    updated(changedProperties: PropertyValues): void {
        if (changedProperties.has('background')) {
            this.style.setProperty('--background', this.background);
        }

        const isLight = this.colors.reduce((acc, color) => {
            if (acc && isLightColor(color.color)) {
                return acc;
            } else {
                return false;
            }
        }, true);

        const isDark = this.colors.reduce((acc, color) => {
            if (acc && isDarkColor(color.color, 0.35)) {
                return acc;
            } else {
                return false;
            }
        }, true);

        this.classList.toggle('light', isLight);
        this.classList.toggle('dark', isDark);

        const REFRESHABLE_PROPERTIES = ['icon', 'state', 'sequence', 'animation', 'intro', 'loop', 'speed', 'delay', 'format'];
        for (const prop of REFRESHABLE_PROPERTIES) {
            if (changedProperties.has(prop)) {
                this.refresh();
                break;
            }
        }
    }

    refresh() {
        if (!this.icon || !this.state) {
            return;
        }

        this.iconElement!.icon = this.icon;
        this.iconElement!.state = this.state;

        this.stopProgress();
        this.iconElement?.playerInstance?.seekToStart();

        if (this.isAnimation && (this.loop || this.trigger === 'loop')) {
            this.iconElement!.trigger = 'sequence';
            this.iconElement!.setAttribute('speed', '' + this.speed);
            this.iconElement!.setAttribute('sequence', this.sequence);
            this.iconElement!.setAttribute('duration', '' + this.duration);

            this.startProgress();
        } else if (this.isComponent) {
            let speed: number = this.speed;
            let intro: boolean = this.intro;
            let clickToReplay: boolean = this.trigger === 'in' || this.intro;
            let delay: number = clickToReplay ? 500 : 0;

            if (speed) {
                this.iconElement!.setAttribute('speed', speed.toString());
            } else {
                this.iconElement!.removeAttribute('speed');
            }

            if (delay) {
                this.iconElement!.setAttribute('delay', delay.toString());
            } else {
                this.iconElement!.removeAttribute('delay');
            }

            if (intro) {
                this.iconElement!.setAttribute('intro', '');
            } else {
                this.iconElement!.removeAttribute('intro');
            }

            if (clickToReplay) {
                this.iconElement!.setAttribute('click-to-replay', '');
            } else {
                this.iconElement!.removeAttribute('click-to-replay');
            }

            this.iconElement!.trigger = this.trigger;
        } else {
            this.iconElement!.trigger = 'last-frame';
        }

    }

    startProgress() {
        if (this.progress) {
            return;
        }

        this.progress = new Progress(
            this.iconElement!,
            this.sliderElement!,
            this.playElement!,
            this.sections,
        );

        this.progress.init();
    }

    stopProgress() {
        if (!this.progress) {
            return;
        }

        this.progress.destroy();
        this.progress = null;
    }

    sectionSelect(e: CustomEvent) {
        const section = e.detail.section;
        const target = this.sliderElement?.parentElement;

        const customEvent = new CustomEvent("section", {
            detail: {
                section,
                target,
            },
            cancelable: true,
        });

        this.dispatchEvent(customEvent);

        if (customEvent.defaultPrevented) {
            e.preventDefault();
        }
    }

    render() {
        if (!this.icon) {
            return html`<div class="icon"><slot></slot></div>`;
        }

        let slider: TemplateResult | null = null;

        if (this.isAnimation && (this.loop || this.trigger === 'loop')) {
            if (this.sections.length > 0) {
                const playOnce = this.sequence.includes('idle');

                slider = html`
                    <div class="slider">
                        ${playOnce ? html`<li-pictogram class="clickable" icon="pause"></li-pictogram>` : null}
                        <li-slider-sections .sections=${this.sections} @section=${this.sectionSelect.bind(this)}></li-slider-sections>
                        <li-label>${parseDuration(this.duration)}</li-label>
                    </div>
                `;
            } else {
                slider = html`
                    <div class="slider">
                        <li-pictogram class="clickable" icon="pause"></li-pictogram>
                        <li-slider fill></li-slider>
                        <li-label>${parseDuration(this.duration)}</li-label>
                    </div>
                `;
            }
        }

        return html`
            <div class="icon">
                <li-icon
                    .stroke=${this.stroke}
                    .colors=${this.parsedColors}>
                </li-icon>
            </div>

            ${slider}
        `;
    }

    get parsedColors() {
        return this.colors.map((color: any) => {
            return `${color.name}:${color.color}`;
        }).join(',');
    }

    get isAnimation() {
        return ['json'].includes(this.format);
    }

    get isComponent() {
        return this.format === 'json';
    }

    static styles = unsafeCSS(CSS);
}