import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './list-item.component.css?raw';

/**
 * A single row of a list. Ported from the portal's `ui/components/list-item.component.ts`.
 *
 * Variants are host classes: `lg` for a two-line row, `capitalize`, `ellipsis`, `compact`.
 */
@customElement('li-list-item')
export class ListItemComponent extends LitElement {
    @property({ type: Boolean, reflect: true })
    active = false;

    @property({ type: Boolean, reflect: true })
    disabled = false;

    render() {
        return html`
            <slot name="prefix"></slot>
            <div><slot></slot></div>
            <slot name="suffix"></slot>
        `;
    }

    static styles = unsafeCSS(CSS);
}
