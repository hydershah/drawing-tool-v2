/**
 * API Client for Backend Communication
 */

import type { Prompt, Artwork } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  async getAll(): Promise<Prompt[]> {
    return apiRequest<Prompt[]>('/api/prompts');
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
  async getAll(): Promise<Artwork[]> {
    return apiRequest<Artwork[]>('/api/artworks');
  },

  async getApproved(): Promise<Artwork[]> {
    return apiRequest<Artwork[]>('/api/artworks/approved');
  },

  async getPending(): Promise<Artwork[]> {
    return apiRequest<Artwork[]>('/api/artworks?status=pending');
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
