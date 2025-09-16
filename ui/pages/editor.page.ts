import { extractLottieProperties, IconState, readStates, tupleColorToHex } from '@lordicon/utils-lottie';
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { AnimationLabelSettingsComponent } from '../components/animation-label-settings.component';
import { ExportButtonComponent } from "../components/export-button.component";
import { PreviewComponent } from '../components/preview.component';
import { DI } from "../core";
import { tooltip } from '../directives';
import { handleAnimation, handleDelay, handleTrigger } from '../helpers';
import CSS from './editor.page.css?raw';

interface Color {
    name: string;
    color: string;
    default: string;
}

interface IconInterface {
    family: string;
    style: string;
    index: string;
    name: string;
    title: string;
    srcJson?: string;
    srcSvg?: string;
    srcPreview?: string;
    dataJson?: any;
    dataSvg?: any;
}

type SUPPORTED_FORMATS = 'svg' | 'json';

const DEFAULT_FORMAT: SUPPORTED_FORMATS = 'json';

const DEFAULT_SIZE = 128;

const DEFAULT_STROKE = 2;

const DEFAULT_SPEED = 1;

const DEFAULT_RENDER_DELAY = [0, 0];

const STROKE_GROUPS = [
    {
        id: '1',
        title: 'light',
    },
    {
        id: '2',
        title: 'regular',
    },
    {
        id: '3',
        title: 'bold',
    },
]

async function hashSHA256(text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderColorsEditor(this: EditorPage) {
    if (!this.supportsColors) {
        return null;
    }

    return html`
        <div class="field-group">
            <li-label>Colors</li-label>
            ${repeat(this.colors, (c: Color) => c.name, (c) => html`
                <li-color-field .default=${c.default} .value=${c.color} @change=${this.changeColor.bind(this, c.default)}></li-color-field>
            `)}
        </div>
    `;
}

function isEmpty(obj: any) {
    if (obj === null || obj === undefined || (typeof obj === 'object' && Object.keys(obj).length === 0)) {
        return true;
    }

    return Object.values(obj).filter(c => c).length === 0;
}

function renderStrokeEditor(this: EditorPage) {
    if (!this.supportsStroke) {
        return null;
    }

    return html`
        <div class="field-group">
            <li-label>Stroke</li-label>
            <li-value-switch @change=${this.changeStroke} .value=${this.stroke} .items=${STROKE_GROUPS}></li-value-switch>
        </div>
    `;
}

function renderAnimationEditor(this: EditorPage, params: { multiple?: boolean, animation?: boolean } = {}) {
    if (!this.supportsStates) {
        return null;
    }

    let states = this.states;

    if (!params.animation) {
        states = states.filter(c => {
            return c.default || c.name.startsWith('morph-');
        });
    }

    if (states.length <= 1) {
        return null;
    }

    return html`
        <div class="field-group">
            <li-animation-label-settings 
                .format=${this.format}
                .intro=${this.renderIntro}
                .loop=${this.renderLoop}
                .speed=${this.renderSpeed}
                .delay=${this.renderDelay}
                .multiple=${params.multiple}
                .trigger=${this.trigger}
                @change=${this.changeAnimationSettings}
            ></li-animation-label-settings>
            <li-state-grid
                @change=${this.changeState}
                .value=${this.state}
                .items=${states}
                .icon=${this.icon.dataJson}
                .animation=${this.supportsAnimation}
            ></li-state-grid>
        </div>
    `;
}

function renderSizeEditor(this: EditorPage) {
    if (!this.supportsSize) {
        return null;
    }

    return html`
        <div class="field-group">
            <li-label>Icon size</li-label>
            <li-field>
                <li-input @change=${this.changeSize} .value=${this.size || ''} optional min="8" max="2048" placeholder="Size" type="number" suffix="px"></li-input>
            </li-field>
            ${this.size ? null : html`<p><small>No size detected. Consider using CSS to define dimensions.</small></p>`}
        </div>
    `;
}

function renderMissingIcon(this: EditorPage) {
    return html`
        <li-header @back=${this.back}>
            ${this.icon.title}
        </li-header>

        <li-layout class="empty column flex">
            <p>Icon not found</p>
        </li-layout>
    `;
}


function renderPremiumIcon(this: EditorPage) {
    const srcPreview = this.icon.srcPreview;

    const openIconPage = __SUPPORT_NEW_TAB__ ? html`<li-pictogram slot="action" class="clickable" icon="arrowGo" ${tooltip('Open icon page')} @click=${this.openIconPage}></li-pictogram>` : null;

    const header = html`
        <li-header @back=${this.back}>
            ${this.icon.title}
            ${openIconPage}
        </li-header>
    `;

    const picture = __SUPPORT_DARK__ ? html`
        <picture>
            <source srcset=${srcPreview + '?dark=1'} media="(prefers-color-scheme: dark)">
            <source srcset=${srcPreview} media="(prefers-color-scheme: light)">
            <img alt="" loading="lazy" src=${srcPreview}/>
        </picture>
    ` : html`
        <picture>
            <img alt="" loading="lazy" src=${srcPreview}/>
        </picture>
    `;

    const signedin = __LORDICON__.status?.user;

    if (signedin) {
        const subscribeToPro = __SUPPORT_NEW_TAB__ ? html`<li-button class="brand" @click=${this.pro}>Subscribe to PRO</li-button>` : null;

        return html`
            ${header}
            <li-layout class="empty column flex">
                ${picture}
                <strong>Upgrade to a PRO plan to edit this icon</strong>
                <p>
                    Unlock full access to the icon library and powerful time-saving features designed to boost your workflow.
                </p>

                ${subscribeToPro}
            </li-layout>
        `;
    } else {
        return html`
            ${header}
            <li-layout class="empty column flex">
                ${picture}
                <strong>Sign in and upgrade to PRO to edit this icon</strong>
                <p>
                    Unlock full access to the icon library and powerful time-saving features designed to boost your workflow.
                </p>

                <li-button class="brand" @click=${this.login}>Login</li-button>
            </li-layout>
        `;
    }
}

@customElement('li-editor-page')
export class EditorPage extends LitElement {
    @query('li-export-button')
    exportButton?: ExportButtonComponent;

    @query('li-animation-label-settings', false)
    animationLabel?: AnimationLabelSettingsComponent;

    @query('li-preview')
    previewElement?: PreviewComponent;

    @property({ type: Object })
    test?: any;

    /**
     * Selected node.
     */
    @state()
    selected!: boolean;

    /**
     * Current icon.
     */
    @state()
    icon!: IconInterface;

    /**
     * Size.
     */
    @state()
    size!: number;

    /**
     * Stroke width.
     */
    @state()
    stroke!: number;

    /**
     * Animation state.
     */
    @state()
    state!: string;

    /**
     * Colors.
     */
    @state()
    colors!: Color[];

    /**
     * Animation loop.
     */
    @state()
    renderLoop!: boolean;

    /**
     * Animation intro.
     */
    @state()
    renderIntro!: boolean;

    /**
     * Animation speed.
     */
    @state()
    renderSpeed!: number;

    /**
     * Animation delay.
     */
    @state()
    renderDelay!: number[];

    /**
     * Changes in editor.
     */
    @state()
    changes!: boolean;

    /**
     * Current format.
     */
    @state()
    format!: SUPPORTED_FORMATS;

    /**
     * Supported states.
     */
    states!: IconState[];

    /**
     * Icon supports animation.
     */
    supportsStates!: boolean;

    /**
     * Icon supports stroke.
     */
    supportsStroke!: boolean;

    /**
     * Icon supports colors.
     */
    supportsColors!: boolean;

    constructor() {
        super();
    }

    reload(icon: IconInterface, assign: any = {}, format?: SUPPORTED_FORMATS) {
        if (icon.dataJson) {
            this.states = readStates(icon.dataJson);
            this.state = assign.state ? this.states.find(c => c.name === assign.state)?.name || '' : this.states.find(c => c.default)?.name || '';

            const properties = extractLottieProperties(icon.dataJson);

            if (assign?.colors?.primary) {
                this.colors = properties.filter(prop => prop.type === 'color').map(prop => {
                    const defaultColor = assign?.colors?.[prop.name] || tupleColorToHex(prop.value);
                    return {
                        name: prop.name,
                        color: defaultColor,
                        default: defaultColor,
                    };
                });
            } else {
                this.colors = properties.filter(prop => prop.type === 'color').map(prop => {
                    const defaultColor = tupleColorToHex(prop.value);
                    return {
                        name: prop.name,
                        color: assign?.colors?.[defaultColor] || defaultColor,
                        default: defaultColor,
                    };
                });
            }

            this.colors = this.colors || [];

            this.supportsStroke = properties.some(prop => prop.name === 'stroke') ? true : false;
            this.supportsColors = properties.some(prop => prop.type === 'color') ? true : false;
            this.supportsStates = this.states.length > 1;
        } else {
            this.colors = [];
            this.states = [];
            this.state = '';
            this.supportsStroke = false;
            this.supportsColors = false;
            this.supportsStates = false;
        }

        this.selected = format ? true : false;
        this.format = format || DEFAULT_FORMAT;
        this.changes = !isEmpty(assign);
        this.stroke = assign.stroke === undefined ? DEFAULT_STROKE : assign.stroke;
        this.size = assign.size === undefined ? DEFAULT_SIZE : assign.size;
        this.renderIntro = assign.intro || false;
        this.renderLoop = assign.loop || false;
        this.renderSpeed = assign.speed === undefined ? DEFAULT_SPEED : assign.speed;
        this.renderDelay = assign.delay || handleDelay(this.state) || DEFAULT_RENDER_DELAY;

        this.icon = icon;
    }

    back() {
        document.dispatchEvent(new CustomEvent('li-show-library'));
    }

    login() {
        document.dispatchEvent(new CustomEvent('li-login'));
    }

    async export() {
        try {
            this.exportButton!.progress = 0;

            // Track only if user is logged in
            if (__LORDICON__.status) {
                await DI.httpService.request('track', {
                    family: this.icon.family,
                    style: this.icon.style,
                    index: this.icon.index,
                });
            }

            const icon = {
                family: this.icon.family,
                style: this.icon.style,
                index: this.icon.index,
                name: this.icon.name,
                title: this.icon.title,
            }

            const properties = {
                format: this.format,
                size: this.size,
                stroke: this.stroke as 1 | 2 | 3,
                state: this.state,
                colors: this.colors.reduce((acc: any, color: Color) => {
                    acc[color.name] = color.color;
                    return acc;
                }, {}),
                intro: this.renderIntro,
                loop: this.renderLoop,
                speed: this.renderSpeed,
                delay: this.renderDelay,
                sequence: (this.renderLoop || this.trigger === 'loop') ? this.prepareAnimation().sequence : undefined,
            };

            const fileName = `${icon.family}-${icon.style}-${icon.index}-${icon.name}`;

            const renderProperties = {
                stroke: this.stroke as 1 | 2 | 3,
                state: this.state,
                colors: this.colors.reduce((acc: any, color: Color) => {
                    acc[color.name] = color.color;
                    return acc;
                }, {}),
            };
            const hash = await hashSHA256(JSON.stringify(renderProperties));

            const formData = new FormData();
            formData.append('post_id', '' + (__LORDICON__.postId || ''));
            formData.append('family', icon.family);
            formData.append('style', icon.style);
            formData.append('index', icon.index);
            formData.append('name', icon.name);
            formData.append('hash', hash);

            // Create file from JSON data
            if (this.format === 'json') {
                if (!this.icon.dataJson) {
                    throw new Error('Icon data is not available for JSON format.');
                }

                const jsonBlob = new Blob([JSON.stringify(this.icon.dataJson)], { type: 'application/json' });
                const jsonFile = new File([jsonBlob], fileName + '.json', { type: 'application/json' });
                formData.append('json_file', jsonFile);

                const trigger = handleTrigger(this.state);
                if (trigger != 'in') {
                    const svgBlob = await DI.renderService.renderFrameSvg(this.icon.dataJson, {
                        sequence: 'frame:0',
                        properties: renderProperties,
                    });

                    const svgFile = new File([svgBlob.image], fileName + '.svg', { type: 'image/svg+xml' });
                    formData.append('svg_file', svgFile);
                }
            } else if (this.format === 'svg') {
                if (!this.icon.dataSvg) {
                    throw new Error('Icon data is not available for SVG format.');
                }

                const svgBlob = await DI.renderService.renderSvg(this.icon.dataSvg, {
                    properties: renderProperties,
                });

                const svgFile = new File([svgBlob.image], fileName + '.svg', { type: 'image/svg+xml' });
                formData.append('svg_file', svgFile);
            }

            const upload = await DI.httpService.request('upload', formData);

            document.dispatchEvent(new CustomEvent('li-icon-exported', {
                detail: {
                    icon,
                    properties,
                    ...upload,
                },
            }));

            DI.toastService.show('Icon rendered successfully');
        } catch (e: any) {
            DI.toastService.error(e);
        } finally {
            this.exportButton!.finish();
        }
    }

    changeFormat(e: CustomEvent) {
        if (this.supportsStates) {
            this.state = this.states.find(c => c.default)?.name || '';
        }

        this.format = e.detail.value;

        this.resetAnimationSettings();

        this.changes = true;
    }

    changeStroke(e: CustomEvent) {
        this.stroke = +e.detail.value;
        this.changes = true;
    }

    changeState(e: CustomEvent) {
        this.state = e.detail.value;

        this.resetAnimationSettings();

        this.changes = true;
    }

    changeAnimationSettings(e: CustomEvent) {
        this.renderIntro = e.detail.intro;
        this.renderLoop = e.detail.loop;
        this.renderSpeed = e.detail.speed;
        this.renderDelay = e.detail.delay;

        this.changes = true;
    }

    changeSize(e: CustomEvent) {
        this.size = +e.detail.value;
        this.changes = true;
    }

    changeColor(defaultColor: string, e: CustomEvent) {
        const color = this.colors.find(c => c.default === defaultColor);
        color!.color = e.detail.value;

        this.colors = [
            ...this.colors,
        ];

        this.changes = true;
    }

    openIconPage() {
        const url = `icons/${this.icon.family}/${this.icon.style}/${this.icon.index}-${this.icon.name}`;
        window.open(`${__WEBSITE__}/${url}`, '_blank');
    }

    pro() {
        window.open(`${__WEBSITE__}/pricing`, '_blank');
    }

    reset() {
        this.reload(this.icon);

        this.changes = false;
    }

    resetAnimationSettings() {
        this.renderIntro = false;
        this.renderLoop = false;
        this.renderSpeed = DEFAULT_SPEED;
        this.renderDelay = handleDelay(this.state);
    }

    sectionSelect(e: CustomEvent) {
        e.preventDefault();

        this.animationLabel!.openSelect({
            section: e.detail.section,
            target: e.detail.target,
        });
    }

    prepareAnimation() {
        return this.supportsAnimation ? handleAnimation(
            this.icon.dataJson,
            {
                preview: true,
                state: this.state,
                speed: this.renderSpeed,
                delay: this.renderDelay,
                intro: this.renderIntro,
                loop: this.renderLoop,
            },
        ) : { sequence: '', sections: [], duration: 0, multiple: false };
    }

    render() {
        if (!this.icon) {
            return html`
                <div class="loading">
                    <li-spinner></li-spinner>
                </div>
            `;
        }

        if (!this.icon.srcPreview && !this.icon.srcJson) {
            return renderMissingIcon.call(this);
        }

        if (!this.icon.dataJson) {
            return renderPremiumIcon.call(this);
        }

        const { sequence, sections, duration, multiple } = this.prepareAnimation();

        const openIconPage = __SUPPORT_NEW_TAB__ ? html`<li-pictogram slot="action" class="clickable" icon="arrowGo" ${tooltip('Open icon page')} @click=${this.openIconPage}></li-pictogram>` : null;

        return html`
            <li-header @back=${this.back}>
                ${this.icon.title}
                ${openIconPage}
                <li-pictogram slot="action" ?inert=${!this.changes} class="clickable" icon="reset" ${tooltip('Reset')} @click=${this.reset}></li-pictogram>
            </li-header>

            <div class="section">
                <li-preview
                    .format=${this.format}
                    .icon=${this.icon.dataJson}
                    .stroke=${this.stroke}
                    .state=${this.state}
                    .trigger=${this.trigger}
                    .colors=${this.colors}
                    .sequence=${sequence}
                    .sections=${sections}
                    .duration=${duration}
                    .speed=${this.renderSpeed}
                    .delay=${this.renderDelay}
                    .intro=${this.renderIntro}
                    .loop=${this.renderLoop}
                    @section=${this.sectionSelect.bind(this)}
                ><img src=${this.icon.srcPreview}/></li-preview>
            </div>

            <div class="section border">
                <li-export-button
                    more
                    .format=${this.format}
                    .selected=${this.selected}
                    @export=${this.export}
                    @change=${this.changeFormat}
                ></li-export-button>
            </div>

            <div class="body border">
                ${renderAnimationEditor.call(this, { multiple, animation: this.supportsAnimation })}
                ${renderColorsEditor.call(this)}
                ${renderStrokeEditor.call(this)}
                ${renderSizeEditor.call(this)}
            </div>
        `;
    }

    get supportsSize() {
        return ['json', 'svg'].includes(this.format);
    }

    get supportsAnimation() {
        return ['json'].includes(this.format);
    }

    get trigger() {
        let [trigger, ..._name] = this.state.split('-');
        return trigger || 'hover';
    }

    static styles = unsafeCSS(CSS);
}