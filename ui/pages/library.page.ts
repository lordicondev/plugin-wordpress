import { Task, TaskStatus } from '@lit/task';
import { remapColors } from '@lordicon/utils-lottie';
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import no_icons_to_show from '../assets/no-icons-to-show.json';
import styles_doodle_black from '../assets/styles-doodle-black.json';
import styles_doodle_color from '../assets/styles-doodle-color.json';
import styles_doodle_motif from '../assets/styles-doodle-motif.json';
import styles_doodle_outline from '../assets/styles-doodle-outline.json';
import styles_missing from '../assets/styles-missing.json';
import styles_system_regular from '../assets/styles-system-regular.json';
import styles_system_solid from '../assets/styles-system-solid.json';
import styles_wired_flat from '../assets/styles-wired-flat.json';
import styles_wired_gradient from '../assets/styles-wired-gradient.json';
import styles_wired_lineal from '../assets/styles-wired-lineal.json';
import styles_wired_outline from '../assets/styles-wired-outline.json';
import { DI } from "../core";
import { capitalize, IS_DARK, PALETTE_DARK, STYLES_PRIORITY } from '../helpers';
import CSS from './library.page.css?raw';

interface IconData {
    srcPreview: string;
    srcJson: string;
    srcSvg: string;
    premium: boolean;
    name: string;
    title: string;
    states: number;
    family: string;
    style: string;
    index: number;
}

function parseUrlParams(url: string): { [key: string]: string } {
    try {
        let fullUrl: URL;

        // Check if the URL is absolute or relative
        if (url.startsWith('http://') || url.startsWith('https://')) {
            fullUrl = new URL(url);
        } else {
            const baseUrl = window.location.origin;
            fullUrl = new URL(url, baseUrl);
        }

        const params: { [key: string]: string } = {};

        fullUrl.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return params;
    } catch (error) {
        console.error('Invalid URL:', url, error);
        return {};
    }
}

function handleIcons(records: any[]): IconData[] {
    return records.map((c) => {
        return {
            srcPreview: c.files.preview,
            srcJson: c.files.json,
            srcSvg: c.files.svg,
            premium: c.premium,
            name: c.name,
            title: c.title,
            states: 0,
            family: c.family,
            style: c.style,
            index: c.index,
        }
    });
}

function parseLinkHeader(link: string): { [key: string]: string } {
    const entries = link.split(',').map(entry => entry.split(';'));
    const links: { [key: string]: string } = {};

    for (const [url, rel] of entries) {
        links[rel.match(/"(.*)"/)![1]] = url.match(/<(.*)>/)![1];
    }

    return links;
}

function prepareVariants(
    variants: { family: string, style: string; free: number, premium: number }[],
) {
    const result: { id: any, title: string, subtitle?: string, json?: any }[] = [];

    for (const variant of variants) {
        const id = `${variant.family}-${variant.style}`;
        const title = `${capitalize(variant.family)} ${capitalize(variant.style)}`;
        const free = variant.free;
        const premium = variant.premium;
        const subtitle = `${free + premium} icons`;

        const json = STYLES_ICONS[id as keyof typeof STYLES_ICONS] || styles_missing;
        const colors = PALETTE_DARK[`${variant.family}_${variant.style}`];
        if (IS_DARK && colors) {
            remapColors(json, colors);
        }

        result.push({
            id,
            title,
            subtitle,
            json,
        });
    }

    // Chenge order with STYLES_PRIORITY
    const ordered = STYLES_PRIORITY
        .map((style) => result.find((item) => item.id === style))
        .filter(Boolean);
    const rest = result.filter(
        (item) => !STYLES_PRIORITY.includes(item.id)
    );

    return [...ordered, ...rest] as any;
}

function handleSrc(src: string, dark?: boolean) {
    if (dark) {
        return `${src}?dark=1`;
    }

    return src;
}

const PREFERED_VARIANT = 'wired-outline';

const STYLES_ICONS = {
    'wired-outline': styles_wired_outline,
    'wired-flat': styles_wired_flat,
    'wired-lineal': styles_wired_lineal,
    'wired-gradient': styles_wired_gradient,
    'system-regular': styles_system_regular,
    'system-solid': styles_system_solid,
    'doodle-outline': styles_doodle_outline,
    'doodle-motif': styles_doodle_motif,
    'doodle-color': styles_doodle_color,
    'doodle-black': styles_doodle_black,
}

@customElement('li-library-page')
export class LibraryPage extends LitElement {
    @query('.body', true)
    bodyElement?: HTMLElement;

    @state()
    nextLink: string = '';

    @state()
    search: string = '';

    @state()
    variant: string;

    @state()
    variants: { id: any, title: string }[];

    @state()
    icons: IconData[] = [];

    @state()
    link: { [key: string]: string } = {};

    @state()
    iconsTaskA?: Task;

    @state()
    iconsTaskB?: Task;

    @state()
    small: boolean = false;

    constructor() {
        super();

        const preferedVariant = DI.configService.get('variant') || PREFERED_VARIANT;

        this.variants = prepareVariants(__LORDICON__.variants || []);
        this.variant = this.variants.find((c) => c.id === preferedVariant)?.id || this.variants[0]?.id;

        if (!this.variant) {
            return;
        }

        this.iconsTaskA = new Task(
            this,
            {
                task: async ([search, variant], { signal }) => {
                    const [family, style] = variant.split('-');

                    const response = await DI.httpService.request(
                        'icons',
                        {
                            family,
                            style,
                            search,
                        },
                        {
                            signal,
                        }
                    )

                    const icons = response.icons;
                    const link = parseLinkHeader(response.params.link);

                    this.link = link;
                    this.icons = handleIcons(icons);
                    this.small = family === 'system';

                    return { icons, link };
                },
                args: () => [
                    this.search,
                    this.variant,
                ],
            }
        )

        this.iconsTaskB = new Task(
            this,
            {
                task: async ([nextLink], { signal }) => {
                    if (!nextLink) {
                        return { records: [], link: {} };
                    }

                    const nextLinkParams = parseUrlParams(nextLink);

                    const response = await DI.httpService.request(
                        'icons',
                        nextLinkParams,
                        {
                            signal,
                        }
                    )

                    const icons = response.icons;
                    const link = parseLinkHeader(response.params.link);

                    this.link = link;
                    this.icons = [...this.icons, ...handleIcons(icons)];

                    return { icons, link };
                },
                args: () => [
                    this.nextLink,
                ],
            },
        );
    }

    async loadMore() {
        if (this.link.next && this.iconsTaskA!.status != TaskStatus.PENDING && this.iconsTaskB!.status != TaskStatus.PENDING) {
            this.nextLink = this.link.next;
        }
    }

    searchChange(e: CustomEvent) {
        const { search, variant } = e.detail;

        this.search = search;
        this.variant = variant;

        DI.configService.set('variant', variant);
        DI.configService.save();
    }

    async selectIcon(icon: IconData, e: MouseEvent) {
        e.preventDefault();

        document.dispatchEvent(new CustomEvent('li-icon-selected', {
            detail: {
                icon,
            },
        }));
    }

    render() {
        if (!this.variant) {
            return html`
                <div class="empty">
                    <li-icon class="current-color" trigger="hover" .icon=${no_icons_to_show}></li-icon>
                    <p>Failed to fetch the icon list.</p>
                </div>
            `;
        }

        const busy = this.iconsTaskA?.status === TaskStatus.PENDING || this.iconsTaskB?.status === TaskStatus.PENDING;

        const content = busy || this.icons.length ? html`
            <li-layout class="icon-grid">
                ${repeat(this.icons, (c: IconData) => `${c.srcPreview}`, (c) => html`
                    <li-icon-tile
                        @click=${this.selectIcon.bind(this, c)}
                        class=${classMap({ small: this.small })}
                        .srcJson=${handleSrc(c.srcJson, IS_DARK)}
                        .srcPreview=${c.srcPreview}
                        .title=${c.title}
                        .states=${c.states}
                        .premium=${c.premium}>
                    </li-icon-tile>
                `)}
            </li-layout>
        ` : html`
            <div class="empty">
                <li-icon class="current-color" trigger="hover" .icon=${no_icons_to_show}></li-icon>
                <p>Oops! Icons not found</p>
            </div>
        `;

        return html`
            <li-library-parameter
                @change=${this.searchChange}
                .variant=${this.variant} 
                .variants=${this.variants}>
            </li-library-parameter>

            <div class="body">
                ${content}
                ${busy ? html`<div class="busy"><li-spinner></li-spinner></div>` : null}
            </div>
            
            ${this.link.next ? html`<div class="footer"><li-button class="brand" @click=${this.loadMore}>Load more</li-button></div>` : null}
        `;
    }

    static styles = unsafeCSS(CSS);
}
