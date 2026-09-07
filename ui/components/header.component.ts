import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { tooltip } from "../directives";
import CSS from './header.component.css?raw';

@customElement('li-header')
export class HeaderComponent extends LitElement {
    @property({ type: String })
    button = '';

    /**
     * Full heading text, used for the tooltip that appears once the slotted title is cut.
     * The slot itself carries no text we can measure, so the caller states it here as well.
     * Not named `title`: that is a native HTMLElement property and would raise the browser's
     * own tooltip alongside ours.
     */
    @property({ type: String })
    heading = '';

    back() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    render() {
        return html`
            <div class="back_action" @click=${this.back} ${tooltip('Back')}>
                <li-pictogram icon="arrowBack"></li-pictogram>
                <span>${this.button}</span>
            </div>
            <div class="title" ${tooltip(this.heading, { whenTruncated: true })}>
                <slot></slot>
            </div>
            <div class="action">
                <slot name="action"></slot>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}