import { Element as LordIconElement } from '@lordicon/element';
import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import CSS from './state-preview.component.css?raw';

@customElement('li-state-preview')
export class StatePreviewComponent extends LitElement {
    @query('li-icon', true)
    iconElement?: LordIconElement;

    @property({ type: Object })
    icon: any = null;

    @property({ type: String })
    state?: string;

    @property({ type: String })
    target?: string;

    @property()
    animation: boolean = true;

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has('icon') || changedProperties.has('state') || changedProperties.has('animation')) {
            this.refresh();
        }
    }

    refresh() {
        if (!this.icon || !this.state) {
            return;
        }

        this.iconElement!.icon = this.icon;
        this.iconElement!.state = this.state;

        if (this.animation) {
            let [trigger, ..._name] = this.state.split('-');

            if (trigger === 'loop') {
                trigger = 'loop-on-hover';
            }

            let clickToReplay: boolean = trigger === 'in';
            let delay: number = clickToReplay ? 500 : 0;


            if (delay) {
                this.iconElement!.setAttribute('delay', delay.toString());
            } else {
                this.iconElement!.removeAttribute('delay');
            }

            if (clickToReplay) {
                this.iconElement!.setAttribute('click-to-replay', '');
            } else {
                this.iconElement!.removeAttribute('click-to-replay');
            }

            this.iconElement!.trigger = trigger || 'hover';
        } else {
            this.iconElement!.trigger = 'last-frame';
        }
    }

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <li-icon loading="lazy" .target=${this.target}></li-icon>
        `;
    }

    static styles = unsafeCSS(CSS);
}