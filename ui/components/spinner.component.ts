import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import spinnerImage from '../assets/spinner.svg?raw';
import CSS from './spinner.component.css?raw';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';


@customElement('li-spinner')
export class SpinnerComponent extends LitElement {
    render() {
        return html`
            ${unsafeSVG(spinnerImage)}
        `;
    }

    static styles = unsafeCSS(CSS);
}
