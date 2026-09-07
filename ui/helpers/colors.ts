/**
 * Converts a hex color to HSL format.
 * @param hex - The hex color string.
 * @returns An object containing the HSL values.
 */
export function hexToHSL(hex: string): { h: number, s: number, l: number } {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return { h: 0, s: 0, l: 0 };
    }

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s;

    if (max == min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h, s, l,
    };
}

/**
 * Converts a hex color to HSL format.
 * @param hex - The hex color string.
 * @returns An object containing the HSL values.
 */
export function handleColor(color: string, darken?: boolean) {
    const hsl = hexToHSL(color);

    if (hsl.l >= 0.80 && darken) {
        return `hsl(${hsl.h * 360}, ${hsl.s * 100}%, ${80}%)`;
    }

    return `hsl(${hsl.h * 360}, ${hsl.s * 100}%, ${hsl.l * 100}%)`;
}

/**
 * Checks if a color is light.
 * @param color - The color to check.
 * @param ratio - The lightness ratio to compare against.
 * @returns True if the color is light, false otherwise.
 */
export function isLightColor(color: string, ratio: number = 0.80) {
    const hsl = hexToHSL(color);
    return hsl.l >= ratio;
}

/**
 * Checks if a color is dark.
 * @param color - The color to check.
 * @param ratio - The lightness ratio to compare against.
 * @returns True if the color is dark, false otherwise.
 */
export function isDarkColor(color: string, ratio: number = 0.20) {
    const hsl = hexToHSL(color);
    return hsl.l <= ratio;
}

/**
 * Checks if a string is a valid hex color.
 * @param hex - The hex color string to check.
 * @returns True if the string is a valid hex color, false otherwise.
 */
export function isColor(hex: string) {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);


    return !!result;
}