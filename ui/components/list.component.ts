import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import CSS from './list.component.css?raw';
import { repeat } from "lit/directives/repeat.js";

interface ListChangeEvent {
    value: string;
}

interface ListItem {
    id: string;
    title: string;
    subtitle?: string;
    json?: any;
}

@customElement('li-list')
export class ListComponent extends LitElement {
    @property({ type: Array })
    items: ListItem[] = [];

    select(item: ListItem, e: MouseEvent) {
        e.preventDefault();

        const event = new CustomEvent<ListChangeEvent>("change", {
            detail: {
                value: item.id,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        return html`
            ${repeat(this.items, (c: ListItem) => c.id, (c, i) => html`
                <div class="item" @click=${this.select.bind(this, c)}>
                    ${c.json ? html`<li-icon .icon=${c.json} trigger="hover" target="div" />` : ''}
                    <div class="content">
                        <span class="title">${c.title}</span>
                        ${c.subtitle ? html`<span class="subtitle">${c.subtitle}</span>` : ''}
                    </div>
                </div>
            `)}
        `;
    }

    static styles = unsafeCSS(CSS);
}