/**
 * Supabase Storage Service
 * Handles all API calls to Supabase backend
 */

import type { Prompt, Artwork } from '@/types';
import { getCachedPrompts, cachePrompts, invalidatePromptsCache } from './database';

// Use Express backend instead of Supabase Edge Functions
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds (increased for large image payloads)

/**
 * Make API call with timeout
 */
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
  async getAll(options?: { useCache?: boolean; backgroundRefresh?: boolean }): Promise<Prompt[]> {
    const useCache = options?.useCache !== false; // Default to true
    const backgroundRefresh = options?.backgroundRefresh !== false; // Default to true

    // Try to get cached data first
    if (useCache) {
      const cached = await getCachedPrompts();
      if (cached) {
        console.log(`[promptStorage.getAll] Returning ${cached.length} cached prompts`);

        // Optionally refresh cache in background
        if (backgroundRefresh) {
          this.refreshPromptsCache().catch(err => {
            console.error('[promptStorage.getAll] Background refresh failed:', err);
          });
        }

        return cached;
      }
    }

    // Cache miss or disabled - fetch from API
    console.log('[promptStorage.getAll] Cache miss, fetching from API');
    return this.fetchAndCachePrompts();
  },

  async fetchAndCachePrompts(): Promise<Prompt[]> {
    // Express returns array directly, not wrapped
    // Load all prompts by setting a high limit (default is 50)
    const promptsData = await apiCall<any[]>('prompts?limit=1000', {
      method: 'GET',
    });

    console.log('[promptStorage.fetchAndCachePrompts] Sample prompt from API:', promptsData[0]);

    // Transform API response to Prompt format
    // Backend already orders by createdAt DESC and assigns sequential promptNumbers
    const prompts = promptsData.map((p: any) => ({
      id: p.id,
      prompt: p.prompt,
      email: p.email || '',
      status: p.status || 'pending',
      createdAt: p.timestamp || p.createdAt || p.created_at || Date.now(),
      ...(p.completedAt && { completedAt: p.completedAt }),
      ...(p.completed_at && { completedAt: p.completed_at }),
      ...(p.artworkId && { artworkId: p.artworkId }),
      ...(p.artwork_id && { artworkId: p.artwork_id }),
      // Backend provides promptNumber (or prompt_number)
      promptNumber: p.promptNumber || p.prompt_number,
    }));

    console.log('[promptStorage.fetchAndCachePrompts] Transformed prompts sample:', prompts[0]);

    // Sort by prompt number (newest first = highest number first)
    // Ensure we treat promptNumber as a number for proper sorting
    const sorted = prompts.sort((a, b) => {
      const numA = Number(a.promptNumber) || 0;
      const numB = Number(b.promptNumber) || 0;
      return numB - numA;
    });

    console.log('[promptStorage.fetchAndCachePrompts] Sorted prompts - first:', sorted[0]?.promptNumber, 'last:', sorted[sorted.length - 1]?.promptNumber);

    // Cache the prompts
    await cachePrompts(sorted);

    return sorted;
  },

  async refreshPromptsCache(): Promise<void> {
    console.log('[promptStorage.refreshPromptsCache] Starting background refresh');
    await this.fetchAndCachePrompts();
  },

  async create(prompt: string, email: string): Promise<Prompt> {
    console.log('[promptStorage.create] Creating prompt with email:', email);

    const id = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const response = await apiCall<{ id: string; prompt: string; email: string; status: string; createdAt: string }>('prompts', {
      method: 'POST',
      body: JSON.stringify({ id, prompt, email }),
    });

    console.log('[promptStorage.create] Prompt created');

    // Invalidate cache to ensure fresh data on next fetch
    await invalidatePromptsCache();

    // Note: Email is sent by the backend when the prompt is created,
    // so we don't need to send it here to avoid duplicates

    return {
      id: response.id,
      prompt,
      email,
      status: 'pending',
      createdAt: Date.now(),
    };
  },

  async delete(id: string): Promise<void> {
    await apiCall(`prompts/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache after deletion
    await invalidatePromptsCache();
  },

  async addEmail(id: string, email: string): Promise<void> {
    await apiCall(`prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ email }),
    });

    // Invalidate cache after update
    await invalidatePromptsCache();
  },

  async complete(id: string): Promise<void> {
    await apiCall(`prompts/${id}/complete`, {
      method: 'PATCH',
    });

    // Invalidate cache after completion
    await invalidatePromptsCache();
  },
};

/**
 * Artwork Storage API
 */
export const artworkStorage = {
  async getAll(): Promise<Artwork[]> {
    // Express returns array directly for approved artworks
    const artworksData = await apiCall<any[]>('artworks?status=approved', {
      method: 'GET',
    });

    console.log('[artworkStorage.getAll] RAW API Response - Full first artwork:', JSON.stringify(artworksData[0], null, 2));
    console.log('[artworkStorage.getAll] RAW API Response - All field names:', Object.keys(artworksData[0] || {}));

    // Transform API response to Artwork format
    const artworks = artworksData.map((a: any) => {
      const transformed = {
        id: a.id,
        promptNumber: a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? null,
        promptText: a.prompt || a.promptText || a.prompt_text || a.prompttext || null,
        imageData: a.imageData ?? a.image_data ?? a.imageUrl ?? a.imageurl ?? a.image_url ?? a.image,
        promptId: a.promptId ?? a.prompt_id ?? a.promptid ?? null,
        artistName: a.artistName ?? a.artist_name ?? a.artistname ?? null,
        artistEmail: a.artistEmail ?? a.artist_email ?? a.artistemail ?? null,
        status: 'approved' as const,
        createdAt: a.createdAt ?? a.created_at ?? a.timestamp ?? Date.now(),
        approvedAt: a.approvedAt ?? a.approved_at ?? a.timestamp ?? null,
        isAdminCreated: a.isAdminCreated ?? a.is_admin_created ?? (a.type !== 'user_artwork'),
      };

      console.log('[artworkStorage.getAll] Field extraction check:', {
        'promptNumber found': a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? 'MISSING',
        'promptId found': a.promptId ?? a.prompt_id ?? a.promptid ?? 'MISSING',
        'promptText found': a.prompt ?? a.promptText ?? a.prompt_text ?? a.prompttext ?? 'MISSING',
      });

      return transformed;
    });

    console.log('[artworkStorage.getAll] Transformed artwork sample:', artworks[0]);
    return artworks;
  },

  async getApproved(): Promise<Artwork[]> {
    return this.getAll();
  },

  async getPending(): Promise<Artwork[]> {
    try {
      // Express returns array directly for pending artworks
      const artworksData = await apiCall<any[]>('artworks?status=pending', {
        method: 'GET',
      });

      console.log('[artworkStorage.getPending] RAW API Response - Full first artwork:', JSON.stringify(artworksData[0], null, 2));
      console.log('[artworkStorage.getPending] RAW API Response - All field names:', Object.keys(artworksData[0] || {}));

      const pendingArtworks = artworksData.map((a: any) => {
        const transformed = {
          id: a.id,
          promptNumber: a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? null,
          imageData: a.imageData ?? a.image_data ?? a.imageUrl ?? a.imageurl ?? a.image_url ?? a.image,
          promptId: a.promptId ?? a.prompt_id ?? a.promptid ?? null,
          promptText: a.prompt || a.promptText || a.prompt_text || a.prompttext,
          artistName: a.artistName ?? a.artist_name ?? a.artistname ?? null,
          artistEmail: a.artistEmail ?? a.artist_email ?? a.artistemail ?? null,
          status: 'pending' as const,
          createdAt: a.createdAt ?? a.created_at ?? a.timestamp ?? Date.now(),
          isAdminCreated: false,
        };

        console.log('[artworkStorage.getPending] Field extraction check:', {
          'promptNumber found': a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? 'MISSING',
          'promptId found': a.promptId ?? a.prompt_id ?? a.promptid ?? 'MISSING',
          'promptText found': a.prompt ?? a.promptText ?? a.prompt_text ?? a.prompttext ?? 'MISSING',
        });

        return transformed;
      });

      console.log('[artworkStorage.getPending] Transformed pending artwork:', pendingArtworks[0]);
      return pendingArtworks;
    } catch (error) {
      console.error('[artworkStorage.getPending] Error fetching pending artworks:', error);
      // Return empty array on timeout/error to prevent app crash
      return [];
    }
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
    promptText?: string;
    promptNumber?: number;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }): Promise<Artwork> {
    const id = `artwork_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    if (data.isAdminCreated) {
      // Admin artwork
      const response = await apiCall<{ id: string }>('artworks', {
        method: 'POST',
        body: JSON.stringify({
          id,
          imageData: data.imageData,
          promptNumber: data.promptNumber || 1,
          isAdminCreated: true,
        }),
      });

      return {
        id: response.id,
        promptNumber: data.promptNumber ?? null,
        imageData: data.imageData,
        status: 'approved',
        createdAt: Date.now(),
        approvedAt: Date.now(),
        isAdminCreated: true,
      };
    } else {
      // User artwork submission
      const payload = {
        id,
        promptId: data.promptId,
        promptText: data.promptText || '',
        promptNumber: data.promptNumber || 1,
        imageData: data.imageData,
        artistName: data.artistName || '',
        artistEmail: data.artistEmail,
        isAdminCreated: false,
      };

      console.log('[artworkStorage.create] Submitting user artwork with payload:', {
        ...payload,
        imageData: payload.imageData ? `${payload.imageData.substring(0, 50)}... (${payload.imageData.length} chars)` : 'none',
      });

      const response = await apiCall<{ id: string }>('artworks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[artworkStorage.create] Backend response:', response);

      // Note: Artwork submission email is sent by the backend when the artwork is created,
      // so we don't need to send it here to avoid duplicates

      return {
        id: response.id,
        promptNumber: data.promptNumber || 0,
        imageData: data.imageData,
        promptId: data.promptId,
        promptText: data.promptText,
        artistName: data.artistName,
        artistEmail: data.artistEmail,
        status: 'pending',
        createdAt: Date.now(),
        isAdminCreated: false,
      };
    }
  },

  async approve(id: string): Promise<void> {
    console.log('[artworkStorage.approve] Approving artwork with ID:', id);
    const response = await apiCall(`artworks/${id}/approve`, {
      method: 'PATCH',
    });
    console.log('[artworkStorage.approve] Backend response:', response);
  },

  async reject(id: string): Promise<void> {
    // Delete rejected artworks (Express doesn't have a separate reject endpoint)
    await apiCall(`artworks/${id}`, {
      method: 'DELETE',
    });
  },

  async delete(id: string): Promise<void> {
    await apiCall(`artworks/${id}`, {
      method: 'DELETE',
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
