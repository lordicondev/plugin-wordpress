import { html, LitElement, PropertyValueMap, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import CSS from './input.component.css?raw';

interface InputChangeEvent {
    value: string;
}

interface InputEnterEvent {
    value: string;
}

@customElement('li-input')
export class InputComponent extends LitElement {
    @query('#input', true)
    inputElement?: HTMLInputElement;

    @property({ type: String })
    value: string = '';

    @property({ type: String })
    prefix: string = '';

    @property({ type: String })
    suffix: string = '';

    @property({ type: String })
    placeholder: string = '';

    @property({ type: String })
    type: 'text' | 'number' = 'text';

    @property({ type: Boolean })
    optional: boolean = false;

    @property({ type: Boolean })
    autoselect: boolean = false;

    @property({ type: Boolean })
    liveChange: boolean = false;

    @property({ type: Number })
    maxLength: number = 0;

    @property({ type: Number })
    step: number = 1;

    @property({ type: Number })
    min: number = 0;

    @property({ type: Number })
    max: number = 100;

    firstUpdated(changedProperties: PropertyValueMap<any>) {
        if (this.autofocus) {
            this.focus();
        }
    }

    updated(changedProperties: PropertyValueMap<any>) {
        if (changedProperties.has('value')) {
            this.refresh();
        }
    }

    validate(e: KeyboardEvent) {
        if (this.type !== 'number') {
            return;
        }

        const key = e.key;

        const ignoreKeys = [
            'Tab',
            'Enter',
            'Shift',
            'Control',
            'Alt',
            'Meta',
            'Escape',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'Backspace',
            'Delete',
            'Insert',
            'Home',
            'End',
            'PageUp',
            'PageDown',
        ];

        if (ignoreKeys.includes(key)) {
            return;
        }

        if (key === 'a' && e.ctrlKey) {
            return;
        }

        if (key === 'c' && e.ctrlKey) {
            return;
        }

        if (key === 'v' && e.ctrlKey) {
            return;
        }

        if (key === 'x' && e.ctrlKey) {
            return;
        }

        if (key === '.' && this.step < 1) {
            return;
        }

        if (!/^\d$/.test(key)) {
            e.preventDefault();
        }
    }

    keyUp(e: KeyboardEvent) {
        const hasEnter = e.key === 'Enter';
        const hasEscape = e.key === 'Escape';

        if (hasEscape && this.liveChange) {
            this.inputElement!.value = '';
            this.change();
        } else if (hasEnter || this.liveChange) {
            if (this.value != this.inputElement!.value) {
                this.change();
            }

            if (hasEnter) {
                this.notifyEnter();
            }
        }
    }

    focus() {
        this.inputElement!.focus();

        if (this.autoselect) {
            this.inputElement!.setSelectionRange(-1, -1);
        }
    }

    focused() {
        if (this.autoselect) {
            this.inputElement!.setSelectionRange(0, this.inputElement!.value.length);
        }
    }

    refresh() {
        let value: any = (this.value === undefined || this.value === null) ? '' : this.value;

        if (this.type === 'number') {
            if (value === '' && this.optional) {
                value = '';
            } else if (value !== '') {
                value = parseFloat(value);

                if (!isNaN(value)) {
                    value = Math.round(parseFloat(value) * 100) / 100;
                } else {
                    value = '';
                }
            }
        }

        this.inputElement!.value = '' + value;
    }

    change() {
        const input = this.inputElement!;
        let newValue: string | number = input.value;

        if (this.type === 'number') {
            if (newValue === '' && this.optional) {
                newValue = '';
            } else if (newValue === '' && !this.optional) {
                newValue = this.min;
            } else if (newValue !== '') {
                const numValue = parseFloat(newValue);

                if (!isNaN(numValue)) {
                    newValue = Math.min(this.max, Math.max(this.min, numValue));
                } else {
                    newValue = this.optional ? '' : this.min;
                }
            }
        }

        const valueLabel = '' + newValue;

        input.value = valueLabel;

        if (this.value != newValue) {
            this.value = valueLabel;

            this.refresh();
            this.notifyChange();
        }
    }

    notifyChange() {
        const event = new CustomEvent<InputChangeEvent>("change", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    notifyEnter() {
        const event = new CustomEvent<InputEnterEvent>("enter", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        const prefix = this.prefix ? html`<span class="prefix">${this.prefix}</span>` : null;
        const suffix = this.suffix ? html`<span class="suffix">${this.suffix}</span>` : null;

        return html`
            ${prefix}
            <input
                id="input"
                type=${this.type}
                autocomplete="off"
                placeholder=${this.placeholder}
                maxlength=${this.maxLength || null}
                min=${this.min}
                max=${this.max}
                step=${this.step}
                @keyup=${this.keyUp}
                @keypress=${this.validate}
                @focus=${this.focused}
                @change=${this.change}>
            </input>
            ${suffix}
        `;
    }

    static styles = unsafeCSS(CSS);
}