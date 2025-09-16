import { LitElement, unsafeCSS } from "lit";
import { customElement } from 'lit/decorators.js';
import { OverlayOutletComponent } from "./overlay-outlet.component";
import { ToastComponent } from './toast.component';
import CSS from './toasts.component.css?raw';

/**
 * Toast error interface.
 */
interface ToastError {
    /**
     * Message to be displayed in the toast.
     */
    message: string;
}

export async function showToast(message: string): Promise<void>
export async function showToast(error: ToastError): Promise<void>
export async function showToast(message: any) {
    const toast = new ToastComponent();

    if (typeof message === 'string') {
        toast.innerText = message;
    } else if (typeof message === 'object') {
        toast.innerText = message.message;
    }

    // Insert the toast into the overlay outlet.
    await OverlayOutletComponent.instance.attachElement(toast);

    toast.show();

    // Remove the toast from the overlay outlet after it is hidden.
    toast.addEventListener("hide", () => {
        OverlayOutletComponent.instance.detachElement(toast);
    });
}

@customElement('li-toasts')
export class ToastsComponent extends LitElement {
    public show(message: string) {
        showToast(message);
    }

    static styles = unsafeCSS(CSS);
}