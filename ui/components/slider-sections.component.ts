import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import CSS from './slider-sections.component.css?raw';
import { tooltip } from "../directives";

export interface SliderSectionsChangeEvent {
    value: number;
}

export interface SliderSectionEvent {
    section: SectionInterface;
}

interface SectionInterface {
    duration: number;
    animation: boolean;
    ratio: number;
    title: string;
}

@customElement('li-slider-sections')
export class SliderSectionsComponent extends LitElement {
    @query('#slider', true)
    sliderElement?: HTMLElement;

    @query('#knob', true)
    knobElement?: HTMLElement;

    @property({ type: Number })
    value: number = 0;

    @property({ type: Number })
    minValue: number = 0;

    @property({ type: Number })
    maxValue: number = 100;

    @property({ type: Array })
    sections: SectionInterface[] = [];

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
        this.refresh();
    }

    notifyValue() {
        const event = new CustomEvent<SliderSectionsChangeEvent>('change', {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    clickSection(section: SectionInterface, e: MouseEvent) {
        const customEvent = new CustomEvent<SliderSectionEvent>("section", {
            detail: {
                section,
            },
            cancelable: true,
        });

        this.dispatchEvent(customEvent);

        if (customEvent.defaultPrevented) {
            e.preventDefault();
        }
    }

    render() {
        const sections = this.sections.map((section, index) => {
            const classes = {
                line: true,
                animation: section.animation,
                delay: !section.animation,
                first: index === 0,
                last: index === this.sections.length - 1,
            };

            const styles = {
                width: `${section.ratio * 100}%`,
            };

            const title = section.title;

            return html`
                <div @click=${this.clickSection.bind(this, section)} ${tooltip(title)} style=${styleMap(styles)} class=${classMap(classes)}></div>
            `;
        });

        return html`
            <div id="slider">
                ${sections}
                <div id="knob"></div>
            </div>
        `;
    }

    get progress(): number {
        return this.value / this.maxValue;
    }

    static styles = unsafeCSS(CSS);
}