import { html, LitElement, unsafeCSS } from "lit";
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

    changeColor(e: CustomEvent) {
        let value = parseColor(e.detail.value);
        if (isColor(value)) {
            this.value = parseColor(e.detail.value);

            this.notifyChange();

            ColorsPaletteComponent.addToPalette(this.value, 'recently');
        } else {
            this.value = '';
        }

    }

    inputBlur() {
        if (!this.value) {
            let value = this.default || '';
            if (value.startsWith('#')) {
                value = value.substring(1);
            }
            this.value = this.inputElement!.value = value;
            this.notifyChange();
        }
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