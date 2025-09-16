import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { createPopover, popover } from "../directives";
import { Async, debounce, getScrollBarWidth, TIME_OUT_AFTER } from "../helpers";
import { InputComponent } from "./input.component";
import CSS from './library-parameter.component.css?raw';
import { ListComponent } from "./list.component";

interface SearchChangeEvent {
    search: string;
    variant: string;
    freeIcons: boolean;
}

interface VariantItem {
    id: string;
    title: string;
    subtitle?: string;
    json?: any;
}

const SEARCH_DELAY = 500;

@customElement('li-library-parameter')
export class LibraryParameterComponent extends LitElement {
    @query('li-input', true)
    searchInput?: InputComponent;

    @query('.select', true)
    selectElement?: HTMLElement;

    @query('li-list', true)
    listComponent?: ListComponent;

    @property()
    variants: VariantItem[] = [];

    @property()
    variant: string = '';

    @property()
    search: string = '';

    @property()
    freeIcons: boolean = false;

    protected debouncer?: Async;

    _popover = createPopover();

    firstUpdated() {
        const w = Math.floor(getScrollBarWidth() / 2);
        this.style.setProperty('--scrollbar-width', `${w}px`);
    }

    searchChange(e: CustomEvent) {
        this.search = e.detail.value.trim();

        this.debouncer = debounce(this.debouncer, TIME_OUT_AFTER(SEARCH_DELAY), () => {
            this.notifyChange();
        });
    }

    variantChange(e: CustomEvent) {
        this._popover.close();

        this.variant = e.detail.value;

        this.debouncer = debounce(this.debouncer, TIME_OUT_AFTER(SEARCH_DELAY), () => {
            this.notifyChange();
        });
    }

    filterChange() {
        this.freeIcons = !this.freeIcons;
        this.notifyChange();
    }

    focus() {
        this.searchInput?.focus();
    }

    notifyChange() {
        const event = new CustomEvent<SearchChangeEvent>("change", {
            detail: {
                search: this.search,
                variant: this.variant,
                freeIcons: this.freeIcons,
            },
        });

        this.dispatchEvent(event);
    }

    openPopover() {
        this._popover.open(
            'select',
            this.selectElement!,
        );
    }

    render() {
        return html`
            <div class="search">
                <li-pictogram icon="search"></li-pictogram>
                <li-input autoselect livechange class="slim" placeholder="Search..." @change=${this.searchChange}></li-input>
            </div>

            <div class="select" @click=${this.openPopover}>
                <span>${this.variantLabel}</span>
                <li-pictogram icon="arrowDown"></li-pictogram>
            </div>

            <li-list class="shadow slim" .items=${this.variants} @change=${this.variantChange} ${popover(this._popover)}></li-list>
        `;
    }

    get variantLabel() {
        if (this.variant && this.variants.length > 0) {
            const find = this.variants.find((v) => v.id === this.variant);
            if (find) {
                return find.title;
            }
        }

        return '...';
    }

    static styles = unsafeCSS(CSS);
}