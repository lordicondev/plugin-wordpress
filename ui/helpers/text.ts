/**
 * Capitalize the first letter of a string.
 * @param s string
 * @returns string
 */
export function capitalize(s: string): string {
    return (s && s[0].toUpperCase() + s.slice(1)) || "";
}

/**
 * Parses a number typed by hand, accepting either decimal separator.
 *
 * Values are rendered into a plain text input rather than `type="number"` (see
 * `InputComponent`), so nothing normalises a comma on the way in — a pl/de/fr keyboard offers
 * one by default, and a paste can carry one regardless of the layout.
 * @param text - Raw field contents.
 * @returns The parsed number, or NaN when the text holds none.
 */
export function parseDecimalInput(text: string): number {
    return parseFloat(text.replace(/\s/g, '').replace(',', '.'));
}
