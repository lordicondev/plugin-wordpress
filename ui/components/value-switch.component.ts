import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import CSS from './value-switch.component.css?raw';

interface ValueSwitchChangeEvent {
    value: string;
}

interface ValueSwitchItem {
    id: string;
    title: string;
}

@customElement('li-value-switch')
export class ValueSwitchComponent extends LitElement {
    @property()
    value: string = '';

    @property({ type: Array })
    items: ValueSwitchItem[] = [];

    select(item: ValueSwitchItem, e: MouseEvent) {
        e.preventDefault();

        this.value = '' + item.id;

        this.notifyChange();
    }

    notifyChange() {
        const event = new CustomEvent<ValueSwitchChangeEvent>("change", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        return html`
            ${repeat(this.items, (c: ValueSwitchItem) => c.id, (c) => html`
                <div class=${classMap({ active: this.value == c.id })} @click=${this.select.bind(this, c)}>
                    ${c.title}
                </div>
            `)}
        `;
    }

    static styles = unsafeCSS(CSS);
}