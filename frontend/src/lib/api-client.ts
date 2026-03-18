import { createClient } from './supabase/client';

export class ApiError extends Error {
    constructor(public status: number, public data: any) {
        super(data?.error || data?.message || 'Erro na requisição');
        this.name = 'ApiError';
    }
}

/**
 * Funçao genérica para chamadas HTTP autenticadas com o backend.
 * Resolve automaticamente o JWT do Supabase e formata erros.
 */
async function fetchWithAuth(method: string, endpoint: string, body?: any, customHeaders?: any) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
        ...customHeaders,
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Ensure endpoint starts with /
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    // Some endpoints might return 204 No Content
    if (response.status === 204) {
        return null; // Or undefined
    }

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(response.status, responseData);
    }

    return responseData;
}

export const api = {
    get: (endpoint: string, headers?: any) => fetchWithAuth('GET', endpoint, undefined, headers),
    post: (endpoint: string, body?: any, headers?: any) => fetchWithAuth('POST', endpoint, body, headers),
    patch: (endpoint: string, body?: any, headers?: any) => fetchWithAuth('PATCH', endpoint, body, headers),
    put: (endpoint: string, body?: any, headers?: any) => fetchWithAuth('PUT', endpoint, body, headers),
    delete: (endpoint: string, headers?: any) => fetchWithAuth('DELETE', endpoint, undefined, headers),
};
