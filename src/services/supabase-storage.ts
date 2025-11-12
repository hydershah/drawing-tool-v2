/**
 * Supabase Storage Service
 * Handles all API calls to Supabase backend
 */

import { backendUrl, publicAnonKey } from '@/utils/supabase/info';
import type { Prompt, Artwork } from '@/types';
import * as emailService from './email';

const API_TIMEOUT = 30000; // 30 seconds (increased for large image payloads)

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

    console.log('[promptStorage.getAll] Sample prompt from API:', response.submissions[0]);

    // Sort by creation date (oldest first) to assign sequential numbers
    const sortedSubmissions = [...response.submissions].sort((a, b) => a.timestamp - b.timestamp);

    // Transform API response to Prompt format
    const prompts = sortedSubmissions.map((p: any, index: number) => ({
      id: p.id,
      prompt: p.prompt,
      email: p.email || '',
      status: p.status || 'pending',
      createdAt: p.timestamp,
      ...(p.completedAt && { completedAt: p.completedAt }),
      ...(p.artworkId && { artworkId: p.artworkId }),
      // If backend doesn't provide promptNumber, generate it from index (1-based)
      promptNumber: p.promptNumber || (index + 1),
    }));

    console.log('[promptStorage.getAll] Transformed prompts sample:', prompts[0]);

    // Sort back to newest first for display
    return prompts.sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(prompt: string, email: string): Promise<Prompt> {
    const response = await apiCall<{ success: boolean; id: string }>('submit-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, email }),
    });

    // Send confirmation email (non-blocking)
    emailService.sendPromptSubmissionEmail(email, prompt);

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

  async complete(id: string): Promise<void> {
    await apiCall(`prompts/${id}/complete`, {
      method: 'PATCH',
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

    console.log('[artworkStorage.getAll] RAW API Response - Full first artwork:', JSON.stringify(response.artworks[0], null, 2));
    console.log('[artworkStorage.getAll] RAW API Response - All field names:', Object.keys(response.artworks[0] || {}));

    // Transform API response to Artwork format
    const artworks = response.artworks.map((a: any) => {
      const transformed = {
        id: a.id,
        promptNumber: a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? null,
        promptText: a.prompt || a.promptText || a.prompt_text || a.prompttext || null,
        imageData: a.imageData ?? a.image_data ?? a.imageurl ?? a.image_url,
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
    const response = await apiCall<{ success: boolean; artworks: any[] }>('pending-artworks', {
      method: 'GET',
    });

    console.log('[artworkStorage.getPending] RAW API Response - Full first artwork:', JSON.stringify(response.artworks[0], null, 2));
    console.log('[artworkStorage.getPending] RAW API Response - All field names:', Object.keys(response.artworks[0] || {}));

    const pendingArtworks = response.artworks.map((a: any) => {
      const transformed = {
        id: a.id,
        promptNumber: a.promptNumber ?? a.prompt_number ?? a.promptnumber ?? null,
        imageData: a.imageUrl ?? a.imageData ?? a.image_data,
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
        promptNumber: data.promptNumber ?? null,
        imageData: data.imageData,
        status: 'approved',
        createdAt: Date.now(),
        approvedAt: Date.now(),
        isAdminCreated: true,
      };
    } else {
      // User artwork submission
      // Format promptNumber as 5-digit string (e.g., 00001, 00002)
      const formattedPromptNumber = data.promptNumber
        ? String(data.promptNumber).padStart(5, '0')
        : '00000';

      const payload: any = {
        promptId: data.promptId,
        prompt: data.promptText || '',
        promptName: data.promptText || '',
        promptNumber: formattedPromptNumber,
        imageData: data.imageData,
        artistName: data.artistName || '',
      };

      // Only include artistEmail if it's provided
      if (data.artistEmail) {
        payload.artistEmail = data.artistEmail;
      }

      console.log('[artworkStorage.create] Submitting user artwork with payload:', {
        ...payload,
        imageData: payload.imageData ? `${payload.imageData.substring(0, 50)}... (${payload.imageData.length} chars)` : 'none',
      });

      const response = await apiCall<{ success: boolean; id: string }>('submit-artwork', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[artworkStorage.create] Backend response:', response);

      // Send confirmation email to artist (non-blocking)
      if (data.artistEmail) {
        emailService.sendArtworkSubmissionEmail(
          data.artistEmail,
          data.artistName || 'Artist',
          data.promptText || 'Your artwork',
          data.imageData
        );
      }

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
    const response = await apiCall('approve-artwork', {
      method: 'POST',
      body: JSON.stringify({ artworkId: id }),
    });
    console.log('[artworkStorage.approve] Backend response:', response);
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
