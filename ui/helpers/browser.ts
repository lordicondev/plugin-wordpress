export const IS_MOBILE = matchMedia('(pointer: coarse)').matches;
export const IS_DARK = __SUPPORT_DARK__ ? matchMedia('(prefers-color-scheme: dark)').matches : false;

export function getScrollBarWidth() {
    const el = document.createElement("div");
    el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
    document.body.appendChild(el);
    const width = el.offsetWidth - el.clientWidth;
    el.remove();
    return width;
}
/**
 * Whether the platform's "command" modifier is held — Ctrl on Windows and Linux, Cmd on macOS.
 * @param event - Keyboard or mouse event to inspect.
 */
export function metaKey(event: KeyboardEvent | MouseEvent): boolean {
    return event.ctrlKey || event.metaKey;
}

/**
 * Whether an element's content overflows its box — i.e. whether an ellipsis is showing.
 *
 * Measured on demand rather than observed: `mouseenter` fires after layout, so the widths are
 * current for free, with no ResizeObserver and no extra render.
 *
 * The element has to be block-level. An inline `<span>` outside a flex or grid parent reports
 * 0 for both widths and will never look truncated.
 * @param element - Element to measure.
 */
export function isTruncated(element: HTMLElement): boolean {
    return (
        element.scrollWidth - element.clientWidth > 1 ||
        element.scrollHeight - element.clientHeight > 1
    );
}
