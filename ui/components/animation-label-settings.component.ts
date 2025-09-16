import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { createPopover, popover, tooltip } from "../directives";
import CSS from './animation-label-settings.component.css?raw';
import { AnimationSettingsComponent } from "./animation-settings.component";

@customElement('li-animation-label-settings')
export class AnimationLabelSettingsComponent extends LitElement {
    @query('li-animation-settings', true)
    animationSettingsElement?: AnimationSettingsComponent;

    @query('li-pictogram')
    pictogramElement?: HTMLElement;

    @property({ type: Boolean })
    multiple = false;

    @property({ type: String })
    format: 'svg' | 'json' = 'json';

    @property({ type: String })
    trigger: string = '';

    @property()
    intro = false;

    @property()
    loop = false;

    @property()
    speed = 1;

    @property({ type: Array })
    delay: number[] = [];

    _popover = createPopover();

    async openSelect(params: { section?: any, target?: HTMLElement } = {}) {
        await this.openPopover(params.target);

        if (params.section) {
            this.animationSettingsElement!.focusField(
                params.section.animation ? 'speed' : 'delay',
                !params.section.animation ? params.section?.title : undefined,
            );
        }
    }

    async openPopover(target?: HTMLElement) {
        await this._popover.open('select', target || this);
    }

    settingsChange(e: CustomEvent) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                ...e.detail,
            },
        }));
    }

    firstUpdated() {
        // Its important to get actual element before opening the popover.
        this.animationSettingsElement!;
    }

    render() {
        const settingsButton = this.hasSettings ? html`
            <li-pictogram slot="action" class="clickable" icon="settings" ${tooltip('Animation settings')} @click=${this.openPopover.bind(this, this)}></li-pictogram>
        ` : null;

        let label = 'Animation';

        if (!this.hasSettings) {
            label = 'Variant';
        }

        return html`
            <li-label>
                <span>${label}</span>
                ${settingsButton}
            </li-label>
            <li-animation-settings 
                class="shadow"
                .trigger=${this.trigger}
                .intro=${this.intro}
                .loop=${this.loop}
                .speed=${this.speed}
                .delay=${this.delay}
                .multiple=${this.multiple}
                @change=${this.settingsChange}
                ${popover(this._popover)}
            ></li-animation-settings>
        `;
    }

    get hasSettings() {
        return ['json'].includes(this.format);
    }

    static styles = unsafeCSS(CSS);
}