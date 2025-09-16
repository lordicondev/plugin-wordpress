import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './field.component.css?raw';

@customElement('li-field')
export class FieldComponent extends LitElement {
    render() {
        return html`
            <slot></slot>
        `;
    }

    static styles = unsafeCSS(CSS);
}