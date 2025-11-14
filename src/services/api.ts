/**
 * API Client for Backend Communication
 */

import type { Prompt, Artwork } from '@/types';

// In production, use relative URL since frontend is served by backend
// In development, use localhost
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : '');

/**
 * Pagination types
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  includeCount?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Prompt API
 */
export const promptAPI = {
  async getAll(params?: PaginationParams): Promise<Prompt[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.includeCount) queryParams.set('includeCount', 'true');

    const url = `/api/prompts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest<Prompt[] | PaginatedResponse<Prompt>>(url);

    // Handle both old format (array) and new format (object with data)
    return Array.isArray(response) ? response : response.data;
  },

  async getAllPaginated(params?: PaginationParams): Promise<PaginatedResponse<Prompt>> {
    const queryParams = new URLSearchParams();
    queryParams.set('includeCount', 'true');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `/api/prompts?${queryParams.toString()}`;
    return apiRequest<PaginatedResponse<Prompt>>(url);
  },

  async getById(id: string): Promise<Prompt> {
    return apiRequest<Prompt>(`/api/prompts/${id}`);
  },

  async create(data: { id: string; prompt: string; email: string }): Promise<Prompt> {
    return apiRequest<Prompt>('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<Prompt>): Promise<Prompt> {
    return apiRequest<Prompt>(`/api/prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/prompts/${id}`, { method: 'DELETE' });
  },
};

/**
 * Artwork API
 */
export const artworkAPI = {
  async getAll(params?: PaginationParams): Promise<Artwork[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.includeCount) queryParams.set('includeCount', 'true');

    const url = `/api/artworks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest<Artwork[] | PaginatedResponse<Artwork>>(url);

    // Handle both old format (array) and new format (object with data)
    return Array.isArray(response) ? response : response.data;
  },

  async getAllPaginated(params?: PaginationParams): Promise<PaginatedResponse<Artwork>> {
    const queryParams = new URLSearchParams();
    queryParams.set('includeCount', 'true');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `/api/artworks?${queryParams.toString()}`;
    return apiRequest<PaginatedResponse<Artwork>>(url);
  },

  async getApproved(params?: PaginationParams): Promise<Artwork[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.includeCount) queryParams.set('includeCount', 'true');

    const url = `/api/artworks/approved${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest<Artwork[] | PaginatedResponse<Artwork>>(url);

    // Handle both old format (array) and new format (object with data)
    return Array.isArray(response) ? response : response.data;
  },

  async getApprovedPaginated(params?: PaginationParams): Promise<PaginatedResponse<Artwork>> {
    const queryParams = new URLSearchParams();
    queryParams.set('includeCount', 'true');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `/api/artworks/approved?${queryParams.toString()}`;
    return apiRequest<PaginatedResponse<Artwork>>(url);
  },

  async getPending(params?: PaginationParams): Promise<Artwork[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('status', 'pending');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.includeCount) queryParams.set('includeCount', 'true');

    const url = `/api/artworks?${queryParams.toString()}`;
    const response = await apiRequest<Artwork[] | PaginatedResponse<Artwork>>(url);

    // Handle both old format (array) and new format (object with data)
    return Array.isArray(response) ? response : response.data;
  },

  async getPendingPaginated(params?: PaginationParams): Promise<PaginatedResponse<Artwork>> {
    const queryParams = new URLSearchParams();
    queryParams.set('status', 'pending');
    queryParams.set('includeCount', 'true');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `/api/artworks?${queryParams.toString()}`;
    return apiRequest<PaginatedResponse<Artwork>>(url);
  },

  async getNextPromptNumber(): Promise<number> {
    const result = await apiRequest<{ nextNumber: number }>('/api/artworks/next-number');
    return result.nextNumber;
  },

  async create(data: {
    id: string;
    imageData: string;
    promptId?: string;
    promptText?: string;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
    promptNumber: number;
  }): Promise<Artwork> {
    return apiRequest<Artwork>('/api/artworks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approve(id: string): Promise<Artwork> {
    return apiRequest<Artwork>(`/api/artworks/${id}/approve`, {
      method: 'PATCH',
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/artworks/${id}`, { method: 'DELETE' });
  },
};

/**
 * Health check
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest<{ status: string; timestamp: string }>('/health');
}
