import { IconState } from "@lordicon/utils-lottie";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { tooltip } from "../directives";
import CSS from './state-grid.component.css?raw';

interface StateGridChangeEvent {
    value: string;
}

function handleTitle(item: IconState) {
    const [_state, ...name] = item.name.split('-');

    return name.join('-');
}

function renderGroup(this: StateGridComponent, items: IconState[], _group: string) {
    if (items.length == 0) {
        return null;
    }

    return html`
        ${repeat(items, (c: IconState) => c.name, (c) => html`
            <div ${tooltip(c.name)} class=${classMap({ active: c.name == this.value, item: true })} @click=${this.select.bind(this, c)}>
                <li-state-preview
                    .animation=${this.animation}
                    .icon=${this.icon}
                    .state=${c.name}
                    target=".item">
                </li-state-preview>
                <span>${handleTitle(c)}</span>
            </div>
        `)}
    `;
}

@customElement('li-state-grid')
export class StateGridComponent extends LitElement {
    @property({ type: Array })
    items: IconState[] = [];

    @property({ type: Object })
    icon: any = null;

    @property()
    value: string = '';

    @property()
    animation: boolean = true;

    select(item: IconState, e: MouseEvent) {
        e.preventDefault();

        const event = new CustomEvent<StateGridChangeEvent>("change", {
            detail: {
                value: item.name,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        const inItems = this.items.filter(c => c.name.startsWith('in-'));
        const hoverItems = this.items.filter(c => c.name.startsWith('hover-'));
        const morphItems = this.items.filter(c => c.name.startsWith('morph-'));
        const loopItems = this.items.filter(c => c.name.startsWith('loop-'));

        return html`
            ${renderGroup.call(this, inItems, 'In')}
            ${renderGroup.call(this, hoverItems, 'Hover')}
            ${renderGroup.call(this, morphItems, 'Morph')}
            ${renderGroup.call(this, loopItems, 'Loop')}
        `;
    }

    static styles = unsafeCSS(CSS);
}