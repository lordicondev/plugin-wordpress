/**
 * Interface for multiple async strategies.
 */
export interface AsyncHandler {
    run(callback: any): void;
    cancel(handle: any): void;
}

/**
 * Interface for async task.
 */
export interface Async {
    /**
     * Return true if async task is active.
     */
    readonly active: boolean;

    /**
     * Cancel active task.
     */
    cancel(): void;

    /**
     * Update task.
     */
    update(async: AsyncHandler, callback: any): void;
}

/**
 * Helper class for start and stop async tasks.
 */
export class Debouncer implements Async {
    protected async?: AsyncHandler;
    protected callback?: any;
    protected asyncHandler?: any;

    public cancel() {
        if (this.active && this.async) {
            this.async.cancel(this.asyncHandler);
            this.asyncHandler = undefined;
        }
    }

    public update(async: AsyncHandler, callback: any) {
        this.async = async;
        this.callback = callback;
        this.asyncHandler = async.run(() => {
            this.asyncHandler = undefined;
            this.callback();
        });
    }

    get active(): boolean {
        return this.asyncHandler !== undefined;
    }
}

/**
 * Helper class for start and stop async tasks.
 */
export class Throttler implements Async {
    protected async?: AsyncHandler;
    protected callback?: any;
    protected asyncHandler?: any;

    public cancel() {
        if (this.active && this.async) {
            this.async.cancel(this.asyncHandler);
            this.asyncHandler = undefined;
        }
    }

    public update(async: AsyncHandler, callback: any) {
        this.callback = callback;

        if (!this.asyncHandler) {
            this.async = async;

            this.asyncHandler = async.run(() => {
                this.asyncHandler = undefined;
                this.callback();
            });
        }
    }

    get active(): boolean {
        return this.asyncHandler !== undefined;
    }
}

/**
 * Access for debounce helper.
 */
export function debounce(debouncer: Async | undefined, async: AsyncHandler, callback: () => void): Async {
    if (debouncer) {
        debouncer.cancel();
    } else {
        debouncer = new Debouncer();
    }

    debouncer.update(async, callback);
    return debouncer;
}

/**
 * Access for throttle helper.
 */
export function throttle(throttler: Async | undefined, async: AsyncHandler, callback: () => void): Async {
    if (!throttler) {
        throttler = new Throttler();
    }

    throttler.update(async, callback);
    return throttler;
}

/**
 * Async handler for setTimeout.
 */
export const TIME_OUT: AsyncHandler = {
    cancel: window.clearTimeout.bind(window),
    run: window.setTimeout.bind(window),
};

/**
 * Async handler for setTimeout (with provided delay).
 */
export const TIME_OUT_AFTER: (delay: number) => AsyncHandler = (delay: number) => {
    return {
        cancel: window.clearTimeout.bind(window),
        run(callback: any) {
            return setTimeout(callback, delay);
        },
    };
};