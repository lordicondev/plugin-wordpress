import { Element as LordIconElement } from '@lordicon/element';
import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { isDarkColor, isLightColor } from "../helpers";
import { AnimationTrigger, ExportFormat } from "../types";
import CSS from './preview.component.css?raw';

const DEFAULT_STROKE = 2;

/**
 * Icon preview for the editor sidebar.
 *
 * It carries one rule: **the element here is configured exactly as `Plugin::render_block()`
 * configures the one on the published page.** Same trigger, same attributes — so hovering
 * the preview shows what a visitor will get, and there is no second playback implementation
 * to drift out of step with PHP.
 *
 * That is why there is no scrub bar, no play button and no timeline. They would describe the
 * animation rather than perform it, and nothing on the published page behaves that way.
 */
@customElement('li-preview')
export class PreviewComponent extends LitElement {
    @query('li-icon', true)
    iconElement?: LordIconElement;

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

    /** Trigger the selected state belongs to, as `render_block()` derives it. */
    @property()
    trigger: AnimationTrigger = 'hover';

    @property({ type: Array })
    colors: any[] = [];

    @property({ type: String })
    format: ExportFormat = 'json';

    @property()
    speed: number = 1;

    @property({ type: Boolean })
    intro: boolean = false;

    updated(changedProperties: PropertyValues): void {
        if (changedProperties.has('background')) {
            this.style.setProperty('--background', this.background);
        }

        const isLight = this.colors.reduce((acc, color) => {
            return acc && isLightColor(color.color);
        }, true);

        const isDark = this.colors.reduce((acc, color) => {
            return acc && isDarkColor(color.color, 0.35);
        }, true);

        this.classList.toggle('light', isLight);
        this.classList.toggle('dark', isDark);

        const REFRESHABLE_PROPERTIES = ['icon', 'state', 'trigger', 'sequence', 'speed', 'intro', 'format'];
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

        const element = this.iconElement!;

        element.icon = this.icon;
        element.state = this.state;

        if (!this.isAnimation) {
            // The static format has no motion to show, so the icon rests on its last frame.
            this.setIconAttribute('speed', null);
            this.setIconAttribute('sequence', null);
            this.setIconAttribute('intro', null);
            this.setIconAttribute('click-to-replay', null);
            element.trigger = 'last-frame';
            return;
        }

        this.setIconAttribute('speed', '' + this.speed);
        this.setIconAttribute('intro', this.intro ? '' : null);

        if (this.sequence) {
            // A sequence replaces the trigger, and carries its own pauses — the element's
            // sequence trigger reads `delay` as a step, never as an attribute.
            this.setIconAttribute('sequence', this.sequence);
            this.setIconAttribute('click-to-replay', null);
            element.trigger = 'sequence';
            return;
        }

        this.setIconAttribute('sequence', null);

        // Editor-only affordance, and the one place this deviates from the page: an entrance
        // animation plays once on mount, so without a way to replay it there would be nothing
        // left to look at. It changes nothing about what a visitor sees.
        const clickToReplay = this.trigger === 'in' || this.intro;
        this.setIconAttribute('click-to-replay', clickToReplay ? '' : null);

        element.trigger = this.trigger;
    }

    /**
     * Sets or removes an attribute in one call; a null value removes it.
     */
    private setIconAttribute(name: string, value: string | null) {
        if (value === null) {
            this.iconElement!.removeAttribute(name);
        } else {
            this.iconElement!.setAttribute(name, value);
        }
    }

    render() {
        if (!this.icon) {
            return html`<div class="icon"><slot></slot></div>`;
        }

        return html`
            <div class="icon">
                <li-icon
                    .stroke=${this.stroke}
                    .colors=${this.parsedColors}>
                </li-icon>
            </div>
        `;
    }

    get parsedColors() {
        return this.colors.map((color: any) => {
            return `${color.name}:${color.color}`;
        }).join(',');
    }

    get isAnimation() {
        return this.format === 'json';
    }

    static styles = unsafeCSS(CSS);
}
