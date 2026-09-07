import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import { createPopover, popover } from "../directives";
import CSS from './color-field.component.css?raw';
import { ColorComponent } from "./color.component";
import { ColorsPaletteComponent, parseColor } from "./colors-palette.component";
import { InputComponent } from "./input.component";
import { isColor } from "../helpers";

interface ColorFieldChangeEvent {
    value: string;
}

@customElement('li-color-field')
export class ColorFieldComponent extends LitElement {
    @query('li-colors-palette', true)
    paletteElement?: ColorsPaletteComponent;

    @query('li-color', true)
    colorElement?: ColorComponent;

    @query('li-input', true)
    inputElement?: InputComponent;

    @property({ type: String })
    value: string = '';

    @property({ type: String })
    default: string = '';

    /**
     * The last colour this field actually held.
     *
     * An invalid entry falls back here rather than to `default`: someone who types over
     * `#ff0000` and mistypes expects their red back, not the icon's original palette colour.
     * Re-seeded whenever the parent rebinds `value`, so a reset still makes the default the
     * fallback again.
     */
    private lastValidValue?: string;

    /**
     * The value this field last assigned itself, so `willUpdate` can tell an external rebind
     * apart from its own write.
     */
    private lastInternalValue?: string;

    _popover = createPopover();

    openPopover() {
        this._popover.open(
            'select',
            this,
            {
                closeBoundary: this.colorElement!,
            },
        );
    }

    willUpdate(changedProperties: PropertyValues) {
        // A value pushed in from outside becomes the new fallback: after a reset, the field
        // should return to the default rather than to whatever was typed before it.
        if (changedProperties.has('value') && this.value !== this.lastInternalValue) {
            this.lastValidValue = isColor(this.value) ? parseColor(this.value) : undefined;
        }
    }

    changeColor(e: CustomEvent) {
        this.applyValue(e.detail.value);
    }

    /**
     * Restores a good value when the field is left empty without a `change` firing — focusing
     * and blurring an emptied field, for one.
     */
    inputBlur() {
        if (!this.value) {
            this.applyValue('');
        }
    }

    /**
     * Normalises an entry, keeps it when it is a colour, and otherwise falls back to the last
     * valid one. The corrected text is pushed into the input directly: Lit dirty-checks the
     * `.value=` binding, so a correction restoring the value the field already held would be
     * skipped and the field would keep showing the rejected text.
     */
    private applyValue(rawValue: string) {
        const value = parseColor(rawValue);
        const target = isColor(value) ? value : this.fallbackFor(value);
        const changed = target !== parseColor(this.value);

        this.lastInternalValue = this.value = target;

        if (isColor(target)) {
            this.lastValidValue = target;
        }

        if (this.inputElement) {
            this.inputElement.value = target;
        }

        if (changed) {
            this.notifyChange();

            if (isColor(target)) {
                ColorsPaletteComponent.addToPalette(target, 'recently');
            }
        }
    }

    /**
     * What an entry that is not a colour resolves to.
     *
     * A field with no `default` — the background picker — treats empty as a real value,
     * transparent, so clearing it has to be allowed to stick. Everywhere else an unusable
     * entry falls back to the last good colour, and to the default before one exists.
     * @param value - The parsed, non-colour entry.
     */
    private fallbackFor(value: string): string {
        if (!value && !this.default) {
            return '';
        }

        return this.lastValidValue ?? parseColor(this.default || '');
    }

    render() {
        let value = this.value || this.default || '';
        if (value.startsWith('#')) {
            value = value.substring(1);
        }

        return html`
            <li-color @click=${this.openPopover} class="clickable" .color=${value}></li-color>

            <li-field>
                <li-input autoselect @blur=${this.inputBlur} @change=${this.changeColor} .value=${value} type="text" suffix="hex" .placeholder=${this.placeholder}></li-input>
            </li-field>  
            
            <li-colors-palette class="shadow" @select=${this.changeColor} ${popover(this._popover)} .value=${value}></li-colors-palette>
        `;
    }

    notifyChange() {
        let value = this.value || '';

        if (value && !value.startsWith('#')) {
            value = `#${value}`;
        }

        this.dispatchEvent(new CustomEvent<ColorFieldChangeEvent>('change', {
            detail: { value },
        }));
    }

    get placeholder() {
        if (!this.default) {
            return 'transparent';
        }

        let defaultLabel = this.default;
        if (defaultLabel.startsWith('#')) {
            defaultLabel = defaultLabel.substring(1);
        }

        return defaultLabel;
    }

    static styles = unsafeCSS(CSS);
}