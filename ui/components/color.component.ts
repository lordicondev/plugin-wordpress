import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './color.component.css?raw';
import { styleMap } from "lit/directives/style-map.js";
import { handleColor } from "../helpers";

@customElement('li-color')
export class ColorComponent extends LitElement {
    @property({ type: String })
    color: string = '';

    render() {
        if (!this.color) {
            return html`
                <div class="transparent"></div>
            `;
        }

        return html`
            <div class="color" style=${styleMap({ '--border-color': handleColor(this.color, true), '--color': handleColor(this.color) })}></div>
        `;
    }

    static styles = unsafeCSS(CSS);
}