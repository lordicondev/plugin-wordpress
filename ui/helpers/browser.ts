export const IS_MOBILE = matchMedia('(pointer: coarse)').matches;
export const IS_DARK = __SUPPORT_DARK__ ? matchMedia('(prefers-color-scheme: dark)').matches : false;

export function getScrollBarWidth() {
    let el = document.createElement("div");
    el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
    document.body.appendChild(el);
    let width = el.offsetWidth - el.clientWidth;
    el.remove();
    return width;
}