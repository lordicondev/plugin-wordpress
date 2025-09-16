import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { tooltip } from "../directives";
import CSS from './header.component.css?raw';

@customElement('li-header')
export class HeaderComponent extends LitElement {
    @property({ type: String })
    button = '';

    back() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    render() {
        return html`
            <div class="back_action" @click=${this.back} ${tooltip('Back')}>
                <li-pictogram icon="arrowBack"></li-pictogram>
                <span>${this.button}</span>
            </div>
            <div class="title">
                <slot></slot>
            </div>
            <div class="action">
                <slot name="action"></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}