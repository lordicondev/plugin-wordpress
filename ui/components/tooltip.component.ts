import { html, LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import { Async, debounce, IS_MOBILE, isTruncated, TIME_OUT_AFTER } from "../helpers";
import CSS from './tooltip.component.css?raw';

interface PositionInterface {
    x: number;
    y: number;
}

const REGISTER_SYMBOL = Symbol();
const SHOW_DELAY = 250;

type TARGET_TYPE = HTMLElement & { [REGISTER_SYMBOL]?: RegisteredTooltip };

export interface TooltipOptions {
    /**
     * Show the tooltip only while the target's text does not fit its box, so a title cut with
     * an ellipsis can be read in full and a title that fits stays quiet.
     */
    whenTruncated?: boolean;
}

export class RegisteredTooltip {
    text: string;
    options: TooltipOptions;
    target: TARGET_TYPE;
    centerTarget: HTMLElement;
    tooltip?: TooltipComponent;

    constructor(text: string, target: HTMLElement, centerTarget?: HTMLElement, options: TooltipOptions = {}) {
        this.text = text;
        this.options = options;
        this.target = target;
        this.centerTarget = centerTarget || target;

        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);

        this.listen(true);
    }

    listen(enabled: boolean) {
        if (enabled) {
            this.target.addEventListener("mouseenter", this.showTooltip);
            this.target.addEventListener("mouseleave", this.hideTooltip);
        } else {
            this.target.removeEventListener("mouseenter", this.showTooltip);
            this.target.removeEventListener("mouseleave", this.hideTooltip);
        }
    }

    discard() {
        this.listen(false);
        this.hideTooltip();

        this.target[REGISTER_SYMBOL] = undefined;
    }

    update(text: string, options?: TooltipOptions) {
        this.text = text;

        if (options) {
            this.options = options;
        }

        if (this.tooltip) {
            this.tooltip.innerText = text;

            this.tooltip.updateComplete.then(() => {
                if (this.tooltip) {
                    this.tooltip.position = this.calcPosition(this.centerTarget, this.tooltip.getBoundingClientRect());
                }
            });
        }
    }

    showTooltip() {
        if (this.text.length === 0 || this.tooltip || IS_MOBILE) {
            return;
        }

        if (this.options.whenTruncated && !isTruncated(this.target)) {
            return;
        }

        RegisteredTooltip.currentDebounce = debounce(RegisteredTooltip.currentDebounce, TIME_OUT_AFTER(SHOW_DELAY), async () => {
            const tooltip = this.tooltip = new TooltipComponent();
            tooltip.innerText = this.text;

            document.body.appendChild(tooltip);
            await tooltip.updateComplete;

            tooltip.position = this.calcPosition(this.centerTarget, tooltip.getBoundingClientRect());
            tooltip.show();
        });
    }

    hideTooltip() {
        if (RegisteredTooltip.currentDebounce) {
            RegisteredTooltip.currentDebounce.cancel();
        }

        if (this.tooltip) {
            document.body.removeChild(this.tooltip);
            this.tooltip = undefined;
        }
    }

    calcPosition(target: HTMLElement, tooltipSize: { width: number, height: number }): PositionInterface {
        const targetRect = target.getBoundingClientRect();

        let x = targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
        let y = targetRect.bottom + window.scrollY;

        // Fix vertical position
        if (y + tooltipSize.height > document.body.clientHeight) {
            y = targetRect.top - tooltipSize.height;
        }

        // Fix horizontal position
        x = Math.max(1, Math.min(window.innerWidth - 1 - tooltipSize.width, x));

        return {
            x,
            y,
        };
    }

    static currentDebounce: Async | undefined = undefined;
}

@customElement('li-tooltip')
export class TooltipComponent extends LitElement {
    _position: PositionInterface = { x: 0, y: 0 }

    show() {
        this.dispatchEvent(new CustomEvent("show"));
    }

    hide() {
        this.dispatchEvent(new CustomEvent("hide"));
    }

    render() {
        return html`
            <div id="tooltip">
                <slot></slot>
            </div>
        `;
    }

    get position(): PositionInterface {
        return this._position;
    }

    set position(value: PositionInterface) {
        this.style.left = `${value.x}px`;
        this.style.top = `${value.y}px`;

        this._position.x = value.x;
        this._position.y = value.y;
    }

    static register(text: string, target: TARGET_TYPE, center?: HTMLElement, options?: TooltipOptions): RegisteredTooltip {
        let registered: RegisteredTooltip | undefined = target[REGISTER_SYMBOL];
        if (!registered) {
            registered = target[REGISTER_SYMBOL] = new RegisteredTooltip(text, target, center, options);
        }

        return registered;
    }

    static styles = unsafeCSS(CSS);
}