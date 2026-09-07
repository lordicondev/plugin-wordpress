import { inject, injectable, optional } from 'inversify';
import { TYPES } from '../core';

/**
 * HTTP service interface.
 */
export interface HTTPServiceInterface {
    request(endpoint: string, data?: Record<string, any> | FormData, options?: { signal?: AbortSignal }): Promise<any>;
}

/**
 * HTTP service. Used for making HTTP requests.
 */
@injectable()
export class HTTPService implements HTTPServiceInterface {
    constructor(
        @inject(TYPES.AJAX)
        @optional()
        protected readonly ajax: { url: string, nonce: string } = { url: '', nonce: '' },
    ) {
    }

    async request(
        endpoint: string,
        data: Record<string, any> | FormData = {},
        options: {
            signal?: AbortSignal;
        } = {},
    ): Promise<any> {
        const isFormData = data instanceof FormData;

        let requestBody: FormData | string;
        const headers: Record<string, string> = {};

        if (isFormData) {
            // Obsługa FormData (dla uploadów plików)
            requestBody = data as FormData;
            requestBody.append('action', 'lordicon_request');
            requestBody.append('nonce', this.ajax.nonce);
            requestBody.append('endpoint', endpoint);

            // Nie ustawiamy Content-Type dla FormData - przeglądarka ustawi automatycznie z boundary
        } else {
            // Obsługa URLSearchParams (dla zwykłych requestów)
            const requestData = new URLSearchParams();
            requestData.append('action', 'lordicon_request');
            requestData.append('nonce', this.ajax.nonce);
            requestData.append('endpoint', endpoint);

            Object.entries(data as Record<string, any>).forEach(([key, value]) => {
                requestData.append(key, String(value));
            });

            requestBody = requestData.toString();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        const response = await fetch(this.ajax.url, {
            method: 'POST',
            headers,
            body: requestBody,
            signal: options.signal,
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.data || 'Request failed');
        }

        return result.data;
    }
}
