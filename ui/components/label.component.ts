import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './label.component.css?raw';

@customElement('li-label')
export class LabelComponent extends LitElement {
    render() {
        return html`
            <div class="content">
                <slot></slot>
            </div>
            <div class="action">
                <slot name="action"></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}