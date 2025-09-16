import { html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, query, state } from 'lit/decorators.js';
import { Async, debounce, TIME_OUT_AFTER } from "../helpers";
import CSS from './toast.component.css?raw';

/**
 * Duration of the toast display.
 */
const DURATION = 3000;

/**
 * Duration of the animation.
 */
const ANIMATION_DURATION = 250;

/**
 * Delay before the animation starts.
 */
const ANIMATION_DELAY = 50;

@customElement('li-toast')
export class ToastComponent extends LitElement {
    @query('#toast', true)
    protected toast!: HTMLElement;

    @state()
    protected visible: boolean = false;

    protected animation?: Animation;

    protected hideDebouncer?: Async;

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has('visible')) {
            this.handleVisibilityChange(this.visible);
        }
    }

    /**
     * Show toast.
     */
    show() {
        if (ToastComponent.currentInstance && ToastComponent.currentInstance !== this) {
            ToastComponent.currentInstance.hide();
        }
        ToastComponent.currentInstance = this;

        this.visible = true;

        this.hideDebouncer = debounce(this.hideDebouncer, TIME_OUT_AFTER(DURATION), () => {
            this.hide();
        });
    }

    /**
     * Hide toast.
     */
    hide() {
        if (ToastComponent.currentInstance === this) {
            ToastComponent.currentInstance = undefined;
        }
        if (this.hideDebouncer) {
            this.hideDebouncer.cancel();
        }
        this.visible = false;
    }

    render() {
        return html`
            <div id="toast">
                <slot></slot>
            </div>
        `;
    }

    /**
     * Handle animation finish.
     */
    private onAnimationFinish() {
        if (!this.visible) {
            this.style.display = "none";
        }
        this.dispatchEvent(new CustomEvent(this.visible ? "show" : "hide"));
    }

    /**
     * Handle visibility change. 
     * @param visible - Whether the toast is visible or not.
     */
    private handleVisibilityChange(visible: boolean) {
        let rate: number = 1;

        if (this.animation) {
            rate = +this.animation.currentTime! / (ANIMATION_DURATION + ANIMATION_DELAY);
            this.animation.cancel();
        }

        let transform = ["translateY(100%)", "translateY(0px)"];

        if (!visible) {
            const size = this.getBoundingClientRect().height;
            const s = Math.round((1 - rate) * size);
            if (s > 0) {
                transform = [`translateY(${s}px)`, "translateY(100%)"];
            } else {
                transform = ["translateY(0px)", "translateY(100%)"];
            }
        } else {
            this.style.display = "block";
        }

        this.animation = this.toast.animate({
            transform,
        }, {
            delay: visible ? ANIMATION_DELAY : 0,
            duration: ANIMATION_DURATION,
            fill: "both",
        });

        this.animation.onfinish = () => this.onAnimationFinish();
    }

    /**
     * Current instance of the ToastComponent.
     */
    private static currentInstance: ToastComponent | undefined;

    static styles = unsafeCSS(CSS);
}