import { nothing } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { OverlayOutletComponent } from '../components/overlay-outlet.component';

type POPOVER_PLACEMENTS = 'menu' | 'select';

const MARGIN = 10;

export function createPopover() {
    return new Popover();
}

class Popover {
    _element?: HTMLElement;
    opened: boolean = false;

    register(element: HTMLElement) {
        element.style.display = 'none';

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
    }

    async open(
        placement: POPOVER_PLACEMENTS,
        target: HTMLElement,
        params: {
            closeBoundary?: HTMLElement,
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

        let zIndex: string = '' + index;
        let left: string = '';
        let top: string = '';
        let right: string = '';
        let bottom: string = '';
        let maxWidth: string = '100vw';
        let maxHeight: string = '100vh';
        let width: string = '';
        let height: string = '';

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

            width = `${rect.width}px`;

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
    }
}

class PopoverDirective extends AsyncDirective {
    popover?: Popover;

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

    reconnected() {
    }

    private cleanup() {
        if (this.popover) {
            this.popover.unregister();
            this.popover = undefined;
        }
    }
}

export const popover = directive(PopoverDirective);