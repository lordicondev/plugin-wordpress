import { html, LitElement, TemplateResult, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './icon-tile.component.css?raw';
import { tooltip } from "../directives";

@customElement('li-icon-tile')
export class IconTileComponent extends LitElement {
    @property({ type: String })
    srcJson?: string;

    @property({ type: String })
    srcPreview?: string;

    @property({ type: String })
    title: string = 'Icon';

    @property({ type: Number })
    states: number = 0;

    @property({ type: Boolean })
    premium: boolean = false;

    render() {
        let states: TemplateResult | null = null;
        let premium: TemplateResult | null = null;
        let preview: TemplateResult | null = null;

        if (this.premium) {
            premium = html`
                <span ${tooltip('PRO icon')} class="premium">pro</span>
            `;
        }

        if (this.states > 0) {
            states = html`
                <span ${tooltip('Available animation')} class="states">${this.states}</span>
            `;
        }

        if (this.srcPreview) {
            if (__SUPPORT_DARK__) {
                preview = html`
                    <picture>
                        <source srcset=${this.srcPreview + '?dark=1'} media="(prefers-color-scheme: dark)">
                        <source srcset=${this.srcPreview} media="(prefers-color-scheme: light)">
                        <img alt="" loading="lazy" src=${this.srcPreview}/>
                    </picture>
                `;
            } else {
                preview = html`
                    <picture>
                        <img alt="" loading="lazy" src=${this.srcPreview}/>
                    </picture>
                `;
            }
        }

        return html`
            <div class="container">
                <li-icon
                    loading="interaction"
                    src=${this.srcJson}
                    trigger="hover"
                    target="div"
                >
                    ${preview}
                </li-icon>
                
                <span class="title" ${tooltip(this.title, { whenTruncated: true })}>${this.title}</span>
                
                ${premium}
                ${states}
            </div>
        `;
    }

    static styles = unsafeCSS(CSS);
}
