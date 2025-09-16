/**
 * Capitalize the first letter of a string.
 * @param s string
 * @returns string
 */
export function capitalize(s: string): string {
    return (s && s[0].toUpperCase() + s.slice(1)) || "";
}