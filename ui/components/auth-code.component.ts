import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, queryAll } from 'lit/decorators.js';
import CSS from './auth-code.component.css?raw';
import { InputComponent } from "./input.component";

function toAlphaNumeric(str: string) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
}

export interface AuthCodeChangeEvent {
    value: string;
}

@customElement('li-auth-code')
export class AuthCodeComponent extends LitElement {
    @queryAll('li-input')
    inputs?: NodeListOf<InputComponent>;

    protected firstUpdated(_changedProperties: PropertyValues): void {
        const inputs = Array.from(this.inputs!.values());
        Promise.all(inputs.map(c => c.updateComplete)).then(() => {
            const basicInputs: HTMLInputElement[] = inputs.map((input) => input.nativeInput);
            basicInputs.forEach((input) => {
                this.initInput(input, basicInputs);
            });
        });
    }

    focus() {
        for (let i = this.inputs!.length - 1; i >= 0; i--) {
            const input = this.inputs![i];

            if (i > 0 && this.inputs![i - 1].value) {
                input.focus();
                break;
            } else if (i === 0) {
                input.focus();
                break;
            }
        }
    }

    initInput(input: HTMLInputElement, inputs: HTMLInputElement[]) {
        const index = inputs.indexOf(input);

        const focusPrevious = () => {
            if (index > 0) {
                inputs[index - 1].focus();
            }
        }

        const focusNext = () => {
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        }

        input.addEventListener('focus', () => {
            input.select();
        });

        input.addEventListener('input', () => {
            const value = ('' + input.value).trim();
            if (value.length) {
                focusNext();
            }

            this.notifyChange();
        });

        input.addEventListener('keydown', (e) => {
            const key = e.key;

            if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
                return;
            }

            // Check if the key is not a number or a letter
            const validCharacters = /^[a-zA-Z0-9]$/;
            const isValidKey = validCharacters.test(key);


            if (!isValidKey && !['Backspace', 'Tab', 'Enter'].includes(key)) {
                e.preventDefault();
            }
        });

        input.addEventListener('keyup', (e) => {
            const key = e.key;
            if (key === "Backspace") {
                inputs[index].value = '';
                focusPrevious();
            } else if (key === "Enter") {
                if (this.value.length === inputs.length) {
                    this.notifyEnter();
                }
            }
        });

        input.addEventListener('paste', (e: ClipboardEvent) => {
            e.preventDefault();

            const text = toAlphaNumeric(e.clipboardData?.getData("text") || '');

            if (text.length === this.inputs!.length) {
                for (let i = 0; i < this.inputs!.length; i++) {
                    this.inputs![i].value = inputs[i].value = text[i];
                }

                this.notifyChange();
                this.notifyEnter();

                this.focus();
            } else if (text.length === 1) {
                const index = inputs.indexOf(input);
                this.inputs![index].value = inputs[index].value = text[0];

                this.notifyChange();
            }
        });
    }

    notifyChange() {
        const event = new CustomEvent<AuthCodeChangeEvent>("change", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    notifyEnter() {
        const event = new CustomEvent<AuthCodeChangeEvent>("enter", {
            detail: {
                value: this.value,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        return html`
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
            <p>-</p>
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
            <li-field>
                <li-input autoselect maxlength="1" class="center big uppercase"></li-input>
            </li-field>
        `;
    }

    get value() {
        const values = Array.from(this.inputs!.values()).map(input => input.value);
        return values.join('').toUpperCase();
    }

    static styles = unsafeCSS(CSS);
}