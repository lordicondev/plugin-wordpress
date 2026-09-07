import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import CSS from './switch.component.css?raw';

export interface SwitchChangeEvent {
    value: boolean;
}

/**
 * Toggle. Ported from the portal's `ui/components/switch.component.ts`.
 *
 * The label is a property rather than a slot: it is always plain text, and a slot forced every
 * consumer to also style it.
 */
@customElement('li-switch')
export class Switch extends LitElement {
    @property({ type: String })
    label: string = '';

    @property({ type: Boolean })
    value: boolean = false;

    @property({ type: Boolean, reflect: true })
    disabled = false;

    firstUpdated() {
        this.addEventListener('click', (e) => {
            e.preventDefault();

            if (this.disabled) {
                return;
            }

            this.click();
        });
    }

    click() {
        this.value = !this.value;

        this.notifyValue();
    }

    notifyValue() {
        const event: CustomEvent<SwitchChangeEvent> = new CustomEvent<SwitchChangeEvent>("change", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        const label = this.label ? html`<div id="label">${this.label}</div>` : null;

        return html`
            <div id="switch" class=${classMap({ active: this.value })}>
                <div id="knob"></div>
            </div>
            ${label}
        `;
    }

    static styles = unsafeCSS(CSS);
}
