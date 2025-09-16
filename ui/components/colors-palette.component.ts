import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import CSS from './colors-palette.component.css?raw';
import { isColor } from "../helpers";
import { tooltip } from "../directives";

const COLORS_LIMIT = 10;

interface Color {
    color: string;
    name?: string;
}

const PALETTE = [
    '#faddd1',
    '#fad3d1',
    '#fad1e6',
    '#e5d1fa',
    '#d4d1fa',
    '#d1e3fa',
    '#d1f3fa',
    '#d1faf0',
    '#d1fad7',
    '#ebfad1',
    '#faf9d1',
    '#faefd1',
    '#fae6d1',
    '#f2e2d9',
    '#ffffff',
    '#f4b69c',
    '#f4a09c',
    '#f49cc8',
    '#c69cf4',
    '#a39cf4',
    '#9cc2f4',
    '#9ce5f4',
    '#9cf4df',
    '#9cf4a7',
    '#d4f49c',
    '#f4f19c',
    '#f4dc9c',
    '#f4c89c',
    '#e3c0ac',
    '#e4e4e4',
    '#ee8f66',
    '#ee6d66',
    '#ee66aa',
    '#a866ee',
    '#7166ee',
    '#66a1ee',
    '#66d7ee',
    '#66eece',
    '#66ee78',
    '#bcee66',
    '#eee966',
    '#eeca66',
    '#eeaa66',
    '#d59f80',
    '#b4b4b4',
    '#e86830',
    '#e83a30',
    '#e8308c',
    '#8930e8',
    '#4030e8',
    '#3080e8',
    '#30c9e8',
    '#30e8bd',
    '#30e849',
    '#a5e830',
    '#e8e230',
    '#e8b730',
    '#e88c30',
    '#c67d53',
    '#848484',
    '#c74b16',
    '#c71f16',
    '#c7166f',
    '#6c16c7',
    '#2516c7',
    '#1663c7',
    '#16a9c7',
    '#16c79e',
    '#16c72e',
    '#86c716',
    '#c7c116',
    '#c79816',
    '#c76f16',
    '#a66037',
    '#545454',
    '#913710',
    '#911710',
    '#911051',
    '#4f1091',
    '#1b1091',
    '#104891',
    '#107c91',
    '#109173',
    '#109121',
    '#629110',
    '#918d10',
    '#916f10',
    '#915110',
    '#794628',
    '#242424',
    '#5c230a',
    '#5c0e0a',
    '#5c0a33',
    '#320a5c',
    '#110a5c',
    '#0a2e5c',
    '#0a4e5c',
    '#0a5c49',
    '#0a5c15',
    '#3e5c0a',
    '#5c590a',
    '#5c460a',
    '#5c330a',
    '#4d2c19',
    '#000000',
];

export function parseColor(color: string): string {
    let value = (color || '').trim();

    if (value === 'transparent') {
        value = '';
    }

    if (value.startsWith('#')) {
        value = value.substring(1);
    }

    return value;
}

function renderPalette(this: ColorsPaletteComponent, palette: 'recently' | 'document') {
    const current: Color[] = palette === 'recently' ? this.recentlyPalette : this.documentPalette;

    let label = '';
    switch (palette) {
        case 'recently':
            label = 'Recently used';
            break;
        case 'document':
            label = 'Document colors';
            break;
    }

    return current.length > 0 ? html`
        <li-label>${label}</li-label>
        <div class="recently">
            ${current.map(c => html`
                <li-color
                    @click=${this.colorSelect.bind(this, c.color)}
                    ${tooltip(c.name || '')}
                    .color=${c.color}
                    class=${classMap({ active: c.color == this.value, clickable: true })}
                ></li-color>
            `)}
        </div>
    ` : null;
}

@customElement('li-colors-palette')
export class ColorsPaletteComponent extends LitElement {
    @property({ type: String })
    value: string = '';

    @state()
    palette: Color[] = PALETTE.map(c => ({ color: c }));

    connectedCallback() {
        super.connectedCallback();

        this.requestUpdate();

        ColorsPaletteComponent.instances.push(this);
    }

    disconnectedCallback() {
        const index = ColorsPaletteComponent.instances.indexOf(this);
        if (index > -1) {
            ColorsPaletteComponent.instances.splice(index, 1);
        }

        super.disconnectedCallback();
    }

    colorSelect(value: string, e?: MouseEvent) {
        if (e) {
            e.preventDefault();
        }

        this.value = value;

        const event = new CustomEvent("select", {
            detail: {
                value,
            },
        });

        this.dispatchEvent(event);
    }

    render() {
        return html`
            <div class="grid">
                ${this.palette.map(c => html`
                <div 
                    @click=${this.colorSelect.bind(this, c.color)}
                    style=${styleMap({ color: c.color })}
                    class=${classMap({ active: parseColor(c.color) == parseColor(this.value) })}
                ></div>
                `)}
            </div>

            ${renderPalette.call(this, 'recently')}
            ${renderPalette.call(this, 'document')}
        `;
    }

    get recentlyPalette(): Color[] {
        return ColorsPaletteComponent.recentlyPalette;
    }

    get documentPalette(): Color[] {
        return ColorsPaletteComponent.documentPalette;
    }

    static addToPalette(color: string, palette: 'recently' | 'document', name?: string) {
        color = parseColor(color);

        if (!isColor(color)) {
            return;
        }

        const current = palette === 'recently' ? ColorsPaletteComponent.recentlyPalette : ColorsPaletteComponent.documentPalette;

        if (current.find(c => c.color === color)) {
            return;
        }

        current.unshift({ color, name });
        if (palette === 'recently') {
            while (current.length > COLORS_LIMIT) {
                current.pop();
            }
        }

        ColorsPaletteComponent.instances.forEach(instance => {
            instance.requestUpdate();
        });
    }

    static recentlyPalette: Color[] = [];
    static documentPalette: Color[] = [];

    static instances: ColorsPaletteComponent[] = [];

    static styles = unsafeCSS(CSS);
}