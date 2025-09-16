import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './layout.component.css?raw';

@customElement('li-layout')
export class LayoutComponent extends LitElement {
    render() {
        return html`
            <slot></slot>
        `;
    }

    static styles = unsafeCSS(CSS);
}