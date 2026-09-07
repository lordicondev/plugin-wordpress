import { nothing } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { RegisteredTooltip, TooltipComponent, TooltipOptions } from "../components/tooltip.component";

/**
 * Attaches a tooltip to the element it is placed on:
 * `` html`<div class="title" ${tooltip(name, { whenTruncated: true })}>` ``.
 */
class TooltipDirective extends AsyncDirective {
    private registeredTooltip?: RegisteredTooltip;
    private element?: HTMLElement;
    private tooltipText?: string;
    private tooltipOptions?: TooltipOptions;

    constructor(partInfo: PartInfo) {
        super(partInfo);

        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error('The `tooltip` directive can only be used as an attribute.');
        }
    }

    render(_tooltipText: string, _options?: TooltipOptions) {
        return nothing;
    }

    update(part: any, [tooltipText, options]: [string, TooltipOptions?]) {
        const element = part.element as HTMLElement;

        this.element = element;
        this.tooltipText = tooltipText;
        this.tooltipOptions = options;

        if (tooltipText && element) {
            if (!this.registeredTooltip) {
                this.registeredTooltip = TooltipComponent.register(tooltipText, element, undefined, options);
            } else {
                this.registeredTooltip.update(tooltipText, options);
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
     * Lit calls `disconnected()` during DOM moves — into the overlay outlet's shadow root, for
     * one — but does not re-render on reconnect, so `update()` would never run again. Without
     * this, every tooltip inside a popover went silent the first time it was opened.
     */
    reconnected() {
        if (this.tooltipText && this.element) {
            this.registeredTooltip = TooltipComponent.register(
                this.tooltipText,
                this.element,
                undefined,
                this.tooltipOptions,
            );
        }
    }

    private cleanup() {
        if (this.registeredTooltip) {
            this.registeredTooltip.discard();
            this.registeredTooltip = undefined;
        }
    }
}

export const tooltip = directive(TooltipDirective);
