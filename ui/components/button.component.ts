import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './button.component.css?raw';

@customElement('li-button')
export class ButtonComponent extends LitElement {
    render() {
        return html`
            <div>
                <slot></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}