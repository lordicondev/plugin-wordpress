import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import CSS from './label.component.css?raw';

/**
 * Section heading. Ported from the portal's `ui/components/label.component.ts`.
 *
 * Has no properties: variants are host classes (`sm`, `md`, `gray`, `navy`, `capitalize`) and
 * the `prefix` / `suffix` slots are where a section hangs a control on its own heading — a
 * settings toggle, a reset button, a transparency switch.
 */
@customElement('li-label')
export class LabelComponent extends LitElement {
    render() {
        return html`
            <slot name="prefix"></slot>
            <div class="content">
                <slot></slot>
            </div>
            <slot name="suffix"></slot>
        `;
    }

    static styles = unsafeCSS(CSS);
}
