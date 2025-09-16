import { html, LitElement, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from "lit/directives/style-map.js";
import CSS from './overlay-outlet.component.css?raw';

/**
 * Minimum z-index for the overlay outlet.
 */
const MIN_Z_INDEX = 50;

/**
 * Defines the target for the overlay.
 */
export interface OverlayTarget {
    /**
     * The element to be added to the overlay.
     */
    element: HTMLElement;

    /**
     * Boundary used to determine if the overlay should be closed.
     */
    closeBoundary?: HTMLElement;

    /**
     * Callback executed when the overlay is closed.
     */
    close?: () => void;

    /**
     * Callback to determine if the overlay is closable.
     */
    closable?: () => boolean;
}

/**
 * Defines the rectangle for the overlay.
 */
interface OverlayRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Options for the overlay.
 */
interface OverlayOptions {
    /**
     * Whether to show a mask behind the overlay.
     */
    mask?: boolean;

    /**
     * The submask for the overlay.
     */
    clip?: OverlayRect;
}

/**
 * Layer interface for the overlay.
 */
interface Layer extends OverlayTarget, OverlayOptions { }

function layerIsClosable(layer: Layer): boolean {
    return layer.close && (!layer.closable || layer.closable()) ? true : false;
}

@customElement('li-overlay-outlet')
export class OverlayOutletComponent extends LitElement {
    layers: Layer[] = [];

    constructor() {
        super();

        this.close = this.close.bind(this);
        this.escape = this.escape.bind(this);
    }

    async attachElement(element: HTMLElement) {
        // Wait for updateComplete to ensure the shadow DOM is ready.
        await this.updateComplete;

        // Append the element to the shadow root.
        this.shadowRoot!.appendChild(element);

        // Wait for the element to be ready in the shadow DOM.
        if ('updateComplete' in element) {
            await element.updateComplete;
        }
    }

    detachElement(element: HTMLElement) {
        this.shadowRoot!.removeChild(element);
    }

    ref(target: OverlayTarget, params: OverlayOptions = {}) {
        const layer: Layer = { ...target, ...params };
        this.layers.push(layer);

        if (params.clip) {
            this.style.setProperty('--clip-x', `${params.clip.x}px`);
            this.style.setProperty('--clip-y', `${params.clip.y}px`);
            this.style.setProperty('--clip-w', `${params.clip.w}px`);
            this.style.setProperty('--clip-h', `${params.clip.h}px`);
        }

        this.requestUpdate();

        return this.layerIndex(layer);
    }

    unref() {
        this.layers.pop()!;

        this.requestUpdate();
    }

    escape(e: KeyboardEvent) {
        if (e.defaultPrevented || e.key !== 'Escape' || !this.layers.length) {
            return;
        }

        const layer = this.layers[this.layers.length - 1];

        if (layerIsClosable(layer)) {
            layer.close!();
        }
    }

    close(e: MouseEvent | PointerEvent) {
        if (!this.layers.length || e.defaultPrevented) {
            return;
        }

        const path: HTMLElement[] = Array.from(e.composedPath()).filter(c => c instanceof HTMLElement);
        const layer = this.layers[this.layers.length - 1];
        const isDirectChild = layer.element && path.includes(layer.element);
        const isBoundaryChild = layer.closeBoundary && path.includes(layer.closeBoundary);
        const includes = isDirectChild || isBoundaryChild;

        if (includes) {
            return;
        }

        if (layerIsClosable(layer)) {
            layer.close!();
        }
    }

    connectedCallback() {
        super.connectedCallback();

        if (OverlayOutletComponent.currentInstance) {
            throw new Error("Overlay outlet already in DOM.");
        }

        OverlayOutletComponent.currentInstance = this;

        window.addEventListener('click', this.close);
        window.addEventListener('keydown', this.escape);
    }

    disconnectedCallback() {
        window.removeEventListener('click', this.close);
        window.removeEventListener('keydown', this.escape);

        if (OverlayOutletComponent.currentInstance === this) {
            OverlayOutletComponent.currentInstance = undefined;
        }

        super.disconnectedCallback();
    }

    wheel(e: WheelEvent) {
        e.preventDefault();
    }

    render() {
        const maskIndex = this.maskIndex();
        const clipIndex = this.clipIndex();

        return html`
           <slot></slot>
            ${maskIndex !== -1 ? html`<div @wheel=${this.wheel} id="mask" style=${styleMap({ zIndex: '' + maskIndex })}></div>` : null}
            ${clipIndex !== -1 ? html`<div @wheel=${this.wheel} id="clip" style=${styleMap({ zIndex: '' + clipIndex })}></div>` : null}
        `;
    }

    layerIndex(layer: Layer) {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (this.layers[i] === layer) {
                return MIN_Z_INDEX + i * 3;
            }
        }

        return MIN_Z_INDEX + 2;
    }

    maskIndex() {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (this.layers[i].mask) {
                return this.layerIndex(this.layers[i]) - 2;
            }
        }

        return -1;
    }

    clipIndex() {
        if (this.layers.length && this.layers[this.layers.length - 1].clip) {
            return this.layerIndex(this.layers[this.layers.length - 1]) - 1;
        }

        return -1;
    }

    /**
     * Returns the current instance of the OverlayOutletComponent. If it doesn't exist, it creates a new one and appends it to the body.
     */
    public static get instance(): OverlayOutletComponent {
        if (!OverlayOutletComponent.currentInstance) {
            const element = document.createElement('li-overlay-outlet') as OverlayOutletComponent;
            document.body.appendChild(element);
            OverlayOutletComponent.currentInstance = element;
        }

        return OverlayOutletComponent.currentInstance;
    }

    /**
     * Current instance of the OverlayOutletComponent.
     */
    private static currentInstance: OverlayOutletComponent | undefined;

    static styles = unsafeCSS(CSS);
}