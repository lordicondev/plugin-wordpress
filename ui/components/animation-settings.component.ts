import { html, LitElement, TemplateResult, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './animation-settings.component.css?raw';

interface AnimationSettingsChangeEvent {
    intro: boolean;
    loop: boolean;
    speed: number;
    delay: number[];
}

const DELAY_SCALE = 1000;
const SPEED_SCALE = 1 / 100;

@customElement('li-animation-settings')
export class AnimationSettingsComponent extends LitElement {
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

    @property({ type: Boolean })
    multiple = false;

    changeSpeed(event: CustomEvent) {
        this.speed = +event.detail.value * SPEED_SCALE;
        this.notifyChange();
    }

    changeIntro(event: CustomEvent) {
        this.intro = event.detail.value;
        this.notifyChange();
    }

    changeLoop(event: CustomEvent) {
        this.loop = event.detail.value;
        this.notifyChange();
    }

    changeDelay(index: number, event: CustomEvent) {
        const renderDelay = [...this.delay];
        renderDelay[index] = event.detail.value * DELAY_SCALE;
        this.delay = renderDelay;

        this.notifyChange();
    }

    focusField(type: 'delay' | 'speed', title?: string) {
        const inputs = this.shadowRoot?.querySelectorAll<HTMLElement>(`li-input`)!;
        const input = [...inputs].find((input) => input.getAttribute('data-type') === type && (!title || input.getAttribute('data-title') === title));
        input?.focus();
    }

    notifyChange() {
        const event = new CustomEvent<AnimationSettingsChangeEvent>('change', {
            detail: {
                intro: this.intro,
                loop: this.loop,
                speed: this.speed,
                delay: this.delay,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        let fieldDelayFirst: TemplateResult | null = null;
        let fieldDelaySecond: TemplateResult | null = null;

        if (this.multiple) {
            fieldDelayFirst = html`
                <div class="field-group">
                    <li-label>In delay</li-label>
                    <li-field>
                        <li-input data-type="delay" data-title="In delay" @change=${this.changeDelay.bind(this, 0)} .value=${this.delay[0] / DELAY_SCALE} type="number" suffix="sec" step="0.1" min="0" max="10"></li-input>
                    </li-field>
                </div>
            `;

            fieldDelaySecond = html`
                <div class="field-group">
                    <li-label>Delay</li-label>
                    <li-field>
                        <li-input data-type="delay" data-title="Delay" @change=${this.changeDelay.bind(this, 1)} .value=${this.delay[1] / DELAY_SCALE} type="number" suffix="sec" step="0.1" min="0" max="10"></li-input>
                    </li-field>
                </div>
            `;
        } else {
            fieldDelayFirst = html`
                <div class="field-group">
                    <li-label>Delay</li-label>
                    <li-field>
                        <li-input data-type="delay" data-title="Delay" @change=${this.changeDelay.bind(this, 0)} .value=${this.delay[0] / DELAY_SCALE} type="number" suffix="sec" step="0.1" min="0" max="10"></li-input>
                    </li-field>
                </div>
            `;
        }

        const fieldsDelay = this.loop ? html`
            <div class="row">
                ${fieldDelayFirst}
                ${fieldDelaySecond}
            </div>
        ` : null;

        const fieldSpeed = html`
            <div class="row">
                <div class="field-group">
                    <li-label>Speed</li-label>
                    <li-field>
                        <li-input data-type="speed" @change=${this.changeSpeed} .value=${this.speed / SPEED_SCALE} type="number" suffix="%" step="10" min="10" max="500"></li-input>
                    </li-field>
                </div>
            </div>
        `;

        const fieldIntro = !this.loop && ['hover', 'morph'].includes(this.trigger) ? html`
            <div class="row">
                <div class="field-group">
                    <li-label>Include intro animation</li-label>
                    <li-switch @change=${this.changeIntro} .value=${this.intro}></li-switch>
                </div>
            </div>
        ` : null;

        const fieldLoop = !this.intro && ['hover', 'morph'].includes(this.trigger) ? html`
            <div class="row">
                <div class="field-group">
                    <li-label>Loop</li-label>
                    <li-switch @change=${this.changeLoop} .value=${this.loop}></li-switch>
                </div>
            </div>
        ` : null;

        return html`
            ${fieldIntro}
            ${fieldLoop}
            ${fieldsDelay}
            ${fieldSpeed}
        `;
    }

    static styles = unsafeCSS(CSS);
}