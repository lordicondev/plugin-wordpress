import { html, LitElement, nothing, PropertyValueMap, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { metaKey, parseDecimalInput } from '../helpers';
import CSS from './input.component.css?raw';

export interface InputChangeEvent {
    value: string | number;
}

export interface InputEnterEvent {
    value: string | number;
}

/**
 * Text or number field. Ported from the portal's `ui/components/input.component.ts`.
 *
 * Numbers render into a native **text** input, never `type="number"`: the browser draws a
 * number input's value using the decimal separator of its own locale, so a user on a pl/de/fr
 * system saw "1,0" for a value written as "1.0" — and then could not type the comma back.
 * Owning the rendering keeps the dot in place whatever the locale, at the cost of
 * re-implementing the arrow-key stepping that came free with `type=number`.
 */
@customElement('li-input')
export class InputComponent extends LitElement {
    @query('#input', true)
    private inputElement?: HTMLInputElement;

    @property({ type: String })
    value: string | number = '';

    @property({ type: String })
    prefix: string = '';

    @property({ type: String })
    suffix: string = '';

    @property({ type: String })
    placeholder: string = '';

    @property({ type: String })
    type: 'text' | 'number' = 'text';

    /**
     * Select the whole value when the field takes focus.
     */
    @property({ type: Boolean })
    autoselect: boolean = false;

    /**
     * Allows a numeric field to hold no value at all.
     *
     * WordPress-only. The size field uses it: leaving it empty means "do not emit a size",
     * and the icon falls back to whatever the theme's CSS says. Without this, clearing the
     * field would snap back to `min`.
     */
    @property({ type: Boolean })
    optional: boolean = false;

    /**
     * Emit `change` on every keystroke rather than on commit.
     *
     * Not in the portal, which has a dedicated search component for this. The plugin's library
     * filter is the only caller: it debounces on the other side, and waiting for Enter would
     * make the icon grid feel dead.
     */
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

    /**
     * Show `indeterminateText` in place of a value, for a field standing in for several
     * different ones.
     */
    @property({ type: Boolean })
    indeterminate: boolean = false;

    @property({ type: String })
    indeterminateText: string = 'mixed';

    firstUpdated(_changedProperties: PropertyValueMap<any>) {
        if (this.autofocus) {
            this.focus();
        }
    }

    updated(changedProperties: PropertyValueMap<any>) {
        if (changedProperties.has('value') || changedProperties.has('indeterminate')) {
            this.refresh();
        }
    }

    focus() {
        this.inputElement!.focus();

        if (this.autoselect) {
            this.inputElement!.setSelectionRange(-1, -1);
        }
    }

    /**
     * The underlying `<input>`.
     *
     * Exposed for the auth-code field, which wires arrow keys, paste and auto-advance across
     * six of these and needs the real element to do it. Nothing else should reach in here.
     */
    get nativeInput(): HTMLInputElement {
        return this.inputElement!;
    }

    /**
     * Whether the configured step leaves room for a fraction, and so for a decimal separator.
     */
    private get acceptsDecimals(): boolean {
        return this.step < 1;
    }

    /**
     * Rejects keys a number field cannot take, and re-implements the arrow-key stepping a
     * native number input used to provide.
     */
    private validate(e: KeyboardEvent) {
        if (this.type !== 'number') {
            return;
        }

        const key = e.key;

        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            this.stepBy(key === 'ArrowUp' ? 1 : -1);
            return;
        }

        const ignoreKeys = [
            'Tab',
            'Enter',
            'Shift',
            'Control',
            'Alt',
            'Meta',
            'Escape',
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

        if (['a', 'c', 'v', 'x'].includes(key) && metaKey(e)) {
            return;
        }

        if ((key === '.' || key === ',') && this.acceptsDecimals) {
            this.insertSeparator(e);
            return;
        }

        if (!/^\d$/.test(key)) {
            e.preventDefault();
        }
    }

    /**
     * Types the decimal separator as the dot we display, whichever key produced it — a comma is
     * what a pl/de/fr layout offers, and dropping it left the field looking broken. A second
     * separator is refused, a job the native number input used to do for us.
     */
    private insertSeparator(e: KeyboardEvent) {
        e.preventDefault();

        const input = this.inputElement!;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? start;

        // What the keystroke would leave behind, minus the text it replaces.
        if ((input.value.slice(0, start) + input.value.slice(end)).includes('.')) {
            return;
        }

        input.setRangeText('.', start, end, 'end');
    }

    /**
     * Moves the value by one step, as the arrow keys did while this was a native number input.
     * Steps from the text currently on screen, so a half-typed edit is taken into account.
     */
    private stepBy(direction: number) {
        const current = parseDecimalInput(this.inputElement!.value);
        const from = isNaN(current) ? this.min : current;

        this.commit(this.normalizeValue(from + direction * this.step));
    }

    private keyUp(e: KeyboardEvent) {
        const hasEnter = e.key === 'Enter';
        const hasEscape = e.key === 'Escape';

        if (hasEscape && this.liveChange) {
            this.inputElement!.value = '';
            this.change();
        } else if (hasEnter || this.liveChange) {
            this.change();

            if (hasEnter) {
                this.notifyEnter();
            }
        }
    }

    private focused() {
        if (this.autoselect) {
            this.inputElement!.setSelectionRange(0, this.inputElement!.value.length);
        }
    }

    /**
     * Re-dispatches the native blur at host level. The native event does not bubble, so a
     * consumer listening on `<li-input>` itself would otherwise never see it.
     */
    private handleBlur() {
        this.dispatchEvent(new CustomEvent('blur'));
    }

    /**
     * How many decimal places the step implies.
     */
    private getDecimalPlaces(): number {
        const stepStr = this.step.toString();
        const dotIndex = stepStr.indexOf('.');
        return dotIndex === -1 ? 0 : stepStr.length - dotIndex - 1;
    }

    private refresh() {
        if (this.indeterminate) {
            this.inputElement!.value = '';
            return;
        }

        const raw = this.value === undefined || this.value === null ? '' : this.value;

        if (this.type === 'number') {
            const numValue = parseDecimalInput('' + raw);
            this.inputElement!.value = isNaN(numValue) ? '' : numValue.toFixed(this.getDecimalPlaces());
            return;
        }

        this.inputElement!.value = '' + raw;
    }

    /**
     * Rounds to the precision the field displays and clamps into range, so the value emitted is
     * always the one the user can read back. Without the rounding, 1.55 at a step of 0.1 was
     * stored as 1.55 while the field showed 1.6.
     */
    private normalizeValue(value: number): number {
        return Math.min(
            this.max,
            Math.max(this.min, parseFloat(value.toFixed(this.getDecimalPlaces()))),
        );
    }

    /**
     * Stores a value, announces it only when it actually moved, and redraws the field.
     */
    private commit(value: string | number) {
        if (this.value != value) {
            this.value = value;
            this.notifyChange();
        }

        this.refresh();
    }

    private change() {
        const rawValue = this.inputElement!.value;

        if (this.type !== 'number') {
            this.commit(rawValue);
            return;
        }

        // Parsed leniently rather than read off a native number input: this covers the comma a
        // paste or an uncaught keystroke can still carry in.
        const parsed = parseDecimalInput(rawValue);

        if (isNaN(parsed)) {
            // An optional field accepts being emptied; that is a value in itself.
            if (this.optional && rawValue.trim() === '') {
                this.commit('');
                return;
            }

            // Cleared and then blurred: revert to the last committed value instead of snapping
            // to `min`, which would silently rewrite what the user was editing.
            this.refresh();
            return;
        }

        this.commit(this.normalizeValue(parsed));
    }

    private notifyChange() {
        this.dispatchEvent(new CustomEvent<InputChangeEvent>('change', {
            detail: {
                value: this.value,
            },
        }));
    }

    private notifyEnter() {
        this.dispatchEvent(new CustomEvent<InputEnterEvent>('enter', {
            detail: {
                value: this.value,
            },
        }));
    }

    render() {
        const prefix = this.prefix ? html`<span class="prefix">${this.prefix}</span>` : null;
        const suffix = this.suffix ? html`<span class="suffix">${this.suffix}</span>` : null;

        // `min`/`max`/`step` are deliberately not rendered: they mean nothing to a text input,
        // and the range they describe is enforced in `change` instead. `role`/`aria-value*`
        // stand in for the spinbutton semantics a native number input carried on its own.
        const isNumber = this.type === 'number';

        return html`
            ${prefix}
            <input
                id="input"
                type="text"
                inputmode=${isNumber ? (this.acceptsDecimals ? 'decimal' : 'numeric') : nothing}
                role=${isNumber ? 'spinbutton' : nothing}
                aria-valuemin=${isNumber ? this.min : nothing}
                aria-valuemax=${isNumber ? this.max : nothing}
                aria-valuenow=${isNumber && !this.indeterminate ? this.value : nothing}
                autocomplete="off"
                spellcheck="false"
                placeholder=${this.indeterminate ? this.indeterminateText : this.placeholder}
                maxlength=${this.maxLength || null}
                @keyup=${this.keyUp}
                @keydown=${this.validate}
                @focus=${this.focused}
                @blur=${this.handleBlur}
                @change=${this.change}
            />
            ${suffix}
        `;
    }

    static styles = unsafeCSS(CSS);
}
