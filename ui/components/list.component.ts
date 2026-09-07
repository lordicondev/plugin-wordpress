import { html, LitElement, TemplateResult, unsafeCSS } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import CSS from './list.component.css?raw';

export interface ListChangeEvent<T = string> {
    value: T;
}

/**
 * One selectable row.
 *
 * `icon` has no counterpart in the portal: the plugin's style picker identifies each family
 * by an animated sample rather than by name alone, so an option can carry Lottie data to
 * render into the row's prefix slot.
 */
export interface ListOption<T = string> {
    value: T;
    title?: string | TemplateResult;
    description?: string;
    icon?: any;
}

export interface ListGroup<T = string> {
    options: ListOption<T>[];
    title?: string;
}

/**
 * A list of options, optionally split into titled groups. Ported from the portal's
 * `ui/components/list.component.ts`.
 */
@customElement('li-list')
export class ListComponent<T = string> extends LitElement {
    @property({ type: Array })
    options: ListOption<T>[] | ListGroup<T>[] = [];

    @property()
    value?: T;

    /**
     * Brings the active row into view. Called when the list opens, so a long list does not
     * start scrolled away from the current choice.
     */
    scrollToSelected() {
        const activeItem = this.shadowRoot?.querySelector('li-list-item[active]');

        activeItem?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }

    selectOption(value: T) {
        this.value = value;

        this.dispatchEvent(new CustomEvent<ListChangeEvent<T>>("change", {
            detail: { value },
            bubbles: true,
            composed: true,
        }));
    }

    private renderGroup(options: ListOption<T>[], title?: string): TemplateResult {
        return html`
            <div class="group">
                ${title ? html`<li-label class="sm gray">${title}</li-label>` : null}
                ${repeat(options, (item) => String(item.value), (item) => {
                    const label = item.title ?? String(item.value);
                    const content = item.description ? html`
                        <div class="lines">
                            <div class="title">${label}</div>
                            <div class="description">${item.description}</div>
                        </div>
                    ` : label;

                    const prefix = item.icon ? html`
                        <li-icon slot="prefix" .icon=${item.icon} trigger="hover" target="li-list-item"></li-icon>
                    ` : null;

                    return html`
                        <li-list-item
                            ?active=${this.value === item.value}
                            class=${classMap({ lg: !!item.description, ellipsis: true })}
                            @click=${() => this.selectOption(item.value)}
                        >${prefix}${content}</li-list-item>
                    `;
                })}
            </div>
        `;
    }

    render() {
        const groups: ListGroup<T>[] = this.isGrouped(this.options)
            ? this.options
            : [{ options: this.options }];

        return html`
            <div class="container">
                ${groups.map((group) => this.renderGroup(group.options, group.title))}
            </div>
        `;
    }

    /**
     * Tells a flat option list apart from a grouped one.
     * @param options - Either shape, as bound by the consumer.
     */
    private isGrouped(options: ListOption<T>[] | ListGroup<T>[]): options is ListGroup<T>[] {
        return options.length > 0 && 'options' in options[0];
    }

    static styles = unsafeCSS(CSS);
}
