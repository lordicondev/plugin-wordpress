import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, queryAssignedNodes } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import CSS from './switch.component.css?raw';

export interface SwitchChangeEvent {
    value: boolean;
}

@customElement('li-switch')
export class Switch extends LitElement {
    @queryAssignedNodes({ flatten: true })
    titleNodes!: Array<Node>;

    @property({ type: Boolean })
    value: boolean = false;

    updated() {
        if (this.titleNodes.length) {
            this.classList.add('has-title');
        } else {
            this.classList.remove('has-title');
        }
    }

    firstUpdated() {
        this.addEventListener('click', e => {
            e.preventDefault();
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
        return html`
            <div id="switch" class=${classMap({ active: this.value })}>
                <div id="knob"></div>
            </div>
            <div id="title">
                <slot></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}