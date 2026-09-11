import { nothing } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { OverlayOutletComponent } from '../components/overlay-outlet.component';

type POPOVER_PLACEMENTS = 'menu' | 'select';

const MARGIN = 10;

export interface PopoverOptions {
    /** Runs after the popover is attached and positioned. */
    onOpened?: (element: HTMLElement) => void;
    /** Runs after the popover is detached. */
    onClosed?: (element: HTMLElement) => void;
}

export function createPopover(options: PopoverOptions = {}) {
    return new Popover(options);
}

class Popover {
    _element?: HTMLElement;
    opened: boolean = false;

    constructor(protected options: PopoverOptions = {}) {
    }

    register(element: HTMLElement) {
        // Hidden only while closed. Re-registration happens mid-life — Lit tears the directive
        // down and rebuilds it when the element is moved into the overlay outlet, and again on
        // any re-render of the host — and hiding unconditionally would blank an open popover.
        if (!this.opened) {
            element.style.display = 'none';
        }

        this._element = element;
    }

    unregister() {
    }

    close() {
        if (!this.opened || !this._element) {
            return;
        }

        OverlayOutletComponent.instance.unref();
        OverlayOutletComponent.instance.detachElement(this._element!);

        this.opened = false;

        this.options.onClosed?.(this._element!);
    }

    async open(
        placement: POPOVER_PLACEMENTS,
        target: HTMLElement,
        params: {
            closeBoundary?: HTMLElement,
            /**
             * Floor for a `select` popover, which otherwise takes the trigger's width.
             * Opt-in, because matching the trigger is the right default - it is only wrong
             * where the rows carry more than the trigger does, and the trigger is narrow.
             */
            minWidth?: number,
        } = {}
    ) {
        if (this.opened) {
            this.close();
            return;
        }

        const rect = target.getBoundingClientRect();

        const list = this._element!;

        list.style.display = '';
        list.style.position = 'absolute';

        await OverlayOutletComponent.instance.attachElement(list);

        const index = OverlayOutletComponent.instance.ref({
            element: list,
            closeBoundary: params.closeBoundary || target,
            close: this.close.bind(this),
        }, {
            clip: {
                x: rect?.x || 0,
                y: rect?.y || 0,
                w: rect?.width || 0,
                h: rect?.height || 0,
            },
        })

        const zIndex: string = '' + index;
        let left: string = '';
        let top: string = '';
        let right: string = '';
        let bottom: string = '';
        const maxWidth: string = '100vw';
        let maxHeight: string = '100vh';
        let width: string = '';
        const height: string = '';

        if (placement === 'menu') {
            const ww = window.innerWidth;
            const wh = window.innerHeight;
            const l = rect.left < ww / 2;
            const t = rect.top < wh / 2;

            if (l) {
                left = `${rect.left}px`;
                width = `${Math.min(ww - rect.left - MARGIN, 300)}px`;
            } else {
                right = `${ww - rect.right}px`;
                width = `${Math.min(rect.right - MARGIN, 300)}px`;
            }

            if (t) {
                top = `${rect.top + rect.height + MARGIN}px`;
                maxHeight = `${Math.min(wh - rect.bottom + rect.height + MARGIN * 2, wh)}px`;
            } else {
                bottom = `${wh - rect.bottom + rect.height + MARGIN}px`;
                maxHeight = `${Math.min(rect.top - MARGIN * 2, wh)}px`;
            }
        } else if (placement === 'select') {
            const ww = window.innerWidth;
            const wh = window.innerHeight;
            const l = rect.left < ww / 2;
            const t = rect.top < wh / 2;

            // Anchored to whichever edge is nearer, so the extra width from `minWidth` grows
            // inward, away from the viewport edge, rather than off-screen.
            width = `${Math.min(Math.max(rect.width, params.minWidth ?? 0), ww - MARGIN * 2)}px`;

            if (l) {
                left = `${rect.left}px`;
            } else {
                right = `${ww - rect.right}px`;
            }

            if (t) {
                top = `${rect.top + rect.height}px`;
                maxHeight = `${Math.min(wh - rect.bottom - MARGIN, wh)}px`;
            } else {
                bottom = `${wh - rect.bottom + rect.height}px`;
                maxHeight = `${Math.min(rect.top - MARGIN, wh)}px`;
            }
        }

        Object.assign(list.style, {
            zIndex,
            left,
            top,
            right,
            bottom,
            maxWidth,
            maxHeight,
            width,
            height,
        });

        this.opened = true;

        this.options.onOpened?.(list);
    }
}

class PopoverDirective extends AsyncDirective {
    popover?: Popover;

    /** Kept across a disconnect, so `reconnected` knows what to re-bind. */
    private element?: HTMLElement;
    private boundPopover?: Popover;

    constructor(partInfo: PartInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error('The `popover` directive can only be used as an attribute.');
        }
    }

    render(_popover: Popover) {
        return nothing;
    }

    update(part: any, [popover]: [Popover]) {
        const element = part.element as HTMLElement;

        this.element = element;
        this.boundPopover = popover;

        if (popover && element) {
            if (this.popover !== popover) {
                popover.register(element);

                this.popover = popover;
            }
        } else {
            this.cleanup();
        }

        return nothing;
    }

    disconnected() {
        this.cleanup();
    }

    /**
     * Lit disconnects the directive when the element it sits on is moved — which is exactly
     * what opening a popover does, since the content is relocated into the overlay outlet — and
     * does not re-render on reconnect. Re-binding here keeps the controller and its element
     * together across that move.
     */
    reconnected() {
        if (this.element && this.boundPopover) {
            this.boundPopover.register(this.element);
            this.popover = this.boundPopover;
        }
    }

    private cleanup() {
        if (this.popover) {
            this.popover.unregister();
            this.popover = undefined;
        }
    }
}

export const popover = directive(PopoverDirective);