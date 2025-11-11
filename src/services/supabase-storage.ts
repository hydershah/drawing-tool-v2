/**
 * Supabase Storage Service
 * Handles all API calls to Supabase backend
 */

import { backendUrl, publicAnonKey } from '@/utils/supabase/info';
import type { Prompt, Artwork } from '@/types';

const API_TIMEOUT = 15000; // 15 seconds

/**
 * Make API call with timeout
 */
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${backendUrl}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Prompt Storage API
 */
export const promptStorage = {
  async getAll(): Promise<Prompt[]> {
    const response = await apiCall<{ success: boolean; submissions: any[] }>('prompts', {
      method: 'GET',
    });

    // Transform API response to Prompt format
    return response.submissions.map((p: any) => ({
      id: p.id,
      prompt: p.prompt,
      email: p.email || '',
      status: p.status || 'pending',
      createdAt: p.timestamp,
      ...(p.completedAt && { completedAt: p.completedAt }),
      ...(p.artworkId && { artworkId: p.artworkId }),
    }));
  },

  async create(prompt: string, email: string): Promise<Prompt> {
    const response = await apiCall<{ success: boolean; id: string }>('submit-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, email }),
    });

    return {
      id: response.id,
      prompt,
      email,
      status: 'pending',
      createdAt: Date.now(),
    };
  },

  async delete(id: string): Promise<void> {
    await apiCall('delete-prompt', {
      method: 'POST',
      body: JSON.stringify({ promptId: id }),
    });
  },

  async addEmail(id: string, email: string): Promise<void> {
    await apiCall('add-email-to-prompt', {
      method: 'POST',
      body: JSON.stringify({ promptId: id, email }),
    });
  },
};

/**
 * Artwork Storage API
 */
export const artworkStorage = {
  async getAll(): Promise<Artwork[]> {
    const response = await apiCall<{ artworks: any[] }>('artworks', {
      method: 'GET',
    });

    // Transform API response to Artwork format
    return response.artworks.map((a: any) => ({
      id: a.id,
      promptNumber: a.prompt_number || 0,
      imageData: a.imageData,
      promptId: a.promptId,
      artistName: a.artistName,
      artistEmail: a.artistEmail,
      status: 'approved' as const,
      createdAt: a.timestamp,
      approvedAt: a.approvedAt || a.timestamp,
      isAdminCreated: a.type !== 'user_artwork',
    }));
  },

  async getApproved(): Promise<Artwork[]> {
    return this.getAll();
  },

  async getPending(): Promise<Artwork[]> {
    const response = await apiCall<{ success: boolean; artworks: any[] }>('pending-artworks', {
      method: 'GET',
    });

    return response.artworks.map((a: any) => ({
      id: a.id,
      promptNumber: 0,
      imageData: a.imageUrl || a.imageData, // API returns imageUrl for pending artworks
      promptId: a.promptId,
      artistName: a.artistName,
      artistEmail: a.artistEmail,
      status: 'pending' as const,
      createdAt: a.timestamp,
      isAdminCreated: false,
    }));
  },

  async getById(id: string): Promise<Artwork | undefined> {
    try {
      const allArtworks = await this.getAll();
      const pendingArtworks = await this.getPending();
      return [...allArtworks, ...pendingArtworks].find(a => a.id === id);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      return undefined;
    }
  },

  async create(data: {
    imageData: string;
    promptId?: string;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }): Promise<Artwork> {
    if (data.isAdminCreated) {
      // Admin artwork
      const response = await apiCall<{ success: boolean; id: string }>('save-artwork', {
        method: 'POST',
        body: JSON.stringify({
          imageData: data.imageData,
          prompt: '', // Admin artwork doesn't need prompt text
        }),
      });

      return {
        id: response.id,
        promptNumber: 0,
        imageData: data.imageData,
        status: 'approved',
        createdAt: Date.now(),
        approvedAt: Date.now(),
        isAdminCreated: true,
      };
    } else {
      // User artwork submission
      const response = await apiCall<{ success: boolean; id: string }>('submit-artwork', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '', // Will be linked via promptId
          imageData: data.imageData,
          artistName: data.artistName || '',
          artistEmail: data.artistEmail || '',
        }),
      });

      return {
        id: response.id,
        promptNumber: 0,
        imageData: data.imageData,
        promptId: data.promptId,
        artistName: data.artistName,
        artistEmail: data.artistEmail,
        status: 'pending',
        createdAt: Date.now(),
        isAdminCreated: false,
      };
    }
  },

  async approve(id: string): Promise<void> {
    await apiCall('approve-artwork', {
      method: 'POST',
      body: JSON.stringify({ artworkId: id }),
    });
  },

  async reject(id: string): Promise<void> {
    await apiCall('reject-artwork', {
      method: 'POST',
      body: JSON.stringify({ artworkId: id }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiCall('delete-artwork', {
      method: 'POST',
      body: JSON.stringify({ artworkId: id }),
    });
  },
};

/**
 * Admin Storage API
 */
export const adminStorage = {
  login(): void {
    sessionStorage.setItem('admin_authenticated', 'true');
    sessionStorage.setItem('admin_session_created', Date.now().toString());
  },

  logout(): void {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_session_created');
  },

  isLoggedIn(): boolean {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  },
};
