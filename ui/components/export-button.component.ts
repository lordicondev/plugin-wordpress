import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { createPopover, popover, tooltip } from "../directives";
import CSS from './export-button.component.css?raw';
import { ListComponent } from "./list.component";

interface ExportFormatChangeEvent {
    value: string;
}

interface ExportFormatItem {
    id: string;
    title: string;
}

const LABEL_FORMAT = `More formats`;

const FORMATS: ExportFormatItem[] = [
    { id: 'json', title: 'Interaction' },
    { id: 'svg', title: 'SVG' },
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
    format: 'svg' | 'json' = 'json';

    @property({ type: Array })
    items: ExportFormatItem[] = FORMATS;

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
            <li-list class="shadow" .items=${this.items} @change=${this.formatChange} ${popover(this._popover)}></li-list>
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
        let prefix = this.selected ? 'Replace' : 'Insert';

        switch (this.format) {
            case 'svg':
                return `${prefix} SVG`;
            case 'json':
                return `${prefix} Interaction`;
            default:
                return prefix;
        }
    }

    static styles = unsafeCSS(CSS);
}