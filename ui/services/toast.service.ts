import { injectable } from "inversify";
import { showToast } from "../components/toasts.component";

export interface ToastError {
    /**
     * Message to be displayed in the toast.
     */
    message: string;
}

/**
 * Interface for toast service.
 */
export interface ToastServiceInterface {
    /**
     * Show a toast message.
     */
    show(message: string): void;

    /**
     * Show a toast error message.
     */
    error(error: ToastError | string): void;
}

/**
 * Toast service.
*/
@injectable()
export class ToastService implements ToastServiceInterface {
    show(message: string): void {
        showToast(message);
    }

    error(error: ToastError | string): void {
        showToast(error as any);
    }
}
