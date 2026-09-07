import { OverlayOutletComponent } from "./overlay-outlet.component";
import { ToastComponent } from './toast.component';

/**
 * Toast error interface.
 */
interface ToastError {
    /**
     * Message to be displayed in the toast.
     */
    message: string;
}

/**
 * Shows a transient message.
 *
 * There is no container component: each toast is attached straight to the overlay outlet and
 * detached when it hides. A `<li-toasts>` element used to be declared here as that container,
 * but nothing ever rendered or instantiated it.
 */
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
