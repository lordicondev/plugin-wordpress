import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './button.component.css?raw';

/**
 * Button. Ported from the portal's `ui/components/button.component.ts`.
 *
 * Variants are host classes, not properties — `primary`, `secondary`, `flat`, `danger`, `pro`,
 * sized with `sm` / `md` / `lg`, stretched with `expand`. It dispatches no event of its own:
 * consumers listen for the native `click`, which `disabled` swallows.
 */
@customElement('li-button')
export class ButtonComponent extends LitElement {
    @property({ type: Boolean, reflect: true })
    disabled = false;

    connectedCallback() {
        super.connectedCallback();

        // Capture phase, so a disabled button stops the click before any listener on the host
        // sees it. A `pointer-events: none` would do the same but also kill the tooltip.
        this.addEventListener('click', this.handleClick, true);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick, true);

        super.disconnectedCallback();
    }

    private readonly handleClick = (e: Event) => {
        if (this.disabled || this.hasAttribute('inert')) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    };

    render() {
        return html`
            <div class="container">
                <div class="content">
                    <slot></slot>
                </div>
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}
