import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './scaffold.component.css?raw';

@customElement('li-scaffold')
export class ScaffoldComponent extends LitElement {
    render() {
        return html`
            <div class="row">
                <div class="cover">
                    <slot name="cover"></slot>
                </div>
                <div class="content">
                    <slot></slot>
                </div>
            </div>
            <div class="actions">
                <span></span>
                <slot name="action"></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}