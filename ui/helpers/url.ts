type PARAMS = Record<string, string | number | boolean | undefined>;

/**
 * Convert parameters to a query string.
 * @param params - The parameters to convert to a query string.
 * @returns The query string.
 */
export function queryParams(params: PARAMS) {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }

    const query = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        )
        .join('&');

    return query;
}

/**
 * Convert parameters to a query string with a leading '?'. If there are no parameters, an empty string is returned.
 * @param params - The parameters to convert to a query string.
 * @returns The query string.
 */
export function queryParamsUrl(params: PARAMS) {
    const query = queryParams(params);
    return query ? `?${query}` : '';
}