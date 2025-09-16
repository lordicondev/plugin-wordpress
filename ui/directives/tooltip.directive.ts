import { AsyncDirective } from 'lit/async-directive.js';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { RegisteredTooltip, TooltipComponent } from "../components/tooltip.component";
import { nothing } from 'lit';

class TooltipDirective extends AsyncDirective {
    private registeredTooltip?: RegisteredTooltip;

    constructor(partInfo: PartInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error('The `tooltip` directive can only be used as an attribute.');
        }
    }

    render(_tooltipText: string) {
        return nothing;
    }

    update(part: any, [tooltipText]: [string]) {
        const element = part.element as HTMLElement;

        if (tooltipText && element) {
            if (!this.registeredTooltip) {
                this.registeredTooltip = TooltipComponent.register(tooltipText, element);
            } else {
                this.registeredTooltip.update(tooltipText);
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
        if (this.registeredTooltip) {
            this.registeredTooltip.discard();
            this.registeredTooltip = undefined;
        }
    }
}

export const tooltip = directive(TooltipDirective);