import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { createPopover, popover, tooltip } from "../directives";
import CSS from './export-button.component.css?raw';
import { ExportFormat } from "../types";
import { ListComponent, ListOption } from "./list.component";

interface ExportFormatChangeEvent {
    value: ExportFormat;
}

const LABEL_FORMAT = `More formats`;

/**
 * What the block can insert. WordPress embeds files rather than rendering images, so there
 * are two: the Lottie itself, played on the page, or a single customised frame of artwork.
 */
const FORMATS: ListOption<ExportFormat>[] = [
    { value: 'json', title: 'Interactive', description: 'Animated, responds to the visitor' },
    { value: 'svg', title: 'SVG', description: 'Vector, single frame' },
];

@customElement('li-export-button')
export class ExportButtonComponent extends LitElement {
    @query('li-list', true)
    listComponent?: ListComponent;

    @property({ type: Number })
    progress: number | null = null;

    @property({ type: Boolean })
    more: boolean = false;

    @property({ type: Boolean })
    selected: boolean = false;

    @property({ type: String })
    format: ExportFormat = 'json';

    @property({ type: Array })
    items: ListOption<ExportFormat>[] = FORMATS;

    timer: any = null;

    _popover = createPopover();

    finish() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.progress = 1;
        this.requestUpdate();

        this.timer = setTimeout(() => {
            this.progress = null;
            this.requestUpdate();
        }, 500);
    }

    updated(changedProperties: PropertyValues): void {
        super.update(changedProperties);

        if (changedProperties.has('progress')) {
            if (this.progress !== null) {
                this.classList.add('busy');
                this.style.setProperty('--progress', `${this.progress * 100}%`);
                this.setAttribute('inert', '');
            } else {
                this.classList.remove('busy');
                this.style.setProperty('--progress', `${0}%`);
                this.removeAttribute('inert');
            }
        }
    }

    actionExport() {
        this.dispatchEvent(new CustomEvent('export', {
            detail: {
                format: this.format,
            },
        }));
    }

    actionFormat() {
        this.openPopover();

        this.dispatchEvent(new CustomEvent('more'));
    }

    openPopover() {
        this._popover.open('select', this);
    }

    formatChange(e: CustomEvent) {
        this._popover.close();

        this.format = e.detail.value;

        this.notifyChange();
    }

    notifyChange() {
        const event = new CustomEvent<ExportFormatChangeEvent>("change", {
            detail: {
                value: this.format,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        const moreBtn = this.more ? html`
            <div class="more" @click=${this.actionFormat} ${tooltip(LABEL_FORMAT)}>
                <li-pictogram icon="arrowDown"></li-pictogram>
            </div>
            <li-list class="shadow" .options=${this.items} .value=${this.format} @change=${this.formatChange} ${popover(this._popover)}></li-list>
        ` : null;

        return html`
            <div class="export" @click=${this.actionExport}>
                ${this.progress !== null ? this.progressLabel : this.formatLabel}
            </div>

            ${moreBtn}
        `;
    }

    get progressLabel() {
        return this.progress !== null ? `${Math.round(this.progress * 100)}%` : '';
    }

    get formatLabel() {
        const prefix = this.selected ? 'Replace' : 'Insert';

        switch (this.format) {
            case 'json':
                return `${prefix} icon`;
            case 'svg':
                return `${prefix} SVG`;
            default:
                return prefix;
        }
    }

    static styles = unsafeCSS(CSS);
}