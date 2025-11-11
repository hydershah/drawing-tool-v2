/**
 * Import data from Supabase KV store to local IndexedDB
 * Run this once to migrate your existing data
 */

import type { Prompt, Artwork } from '@/types';
import { importData } from '@/services/database';

interface SupabasePrompt {
  id: string;
  prompt: string;
  email: string;
  timestamp: number;
  status?: string;
  promptNumber?: number;
  completedAt?: number;
  artworkId?: string;
}

interface SupabaseArtwork {
  id: string;
  prompt?: string;
  imageUrl?: string;
  imageData?: string;
  timestamp: number;
  artistName?: string;
  type?: string;
  promptId?: string;
  promptNumber?: number;
  status?: string;
  approvedAt?: number;
}

/**
 * Fetch data from Supabase KV store
 * Replace with your actual Supabase credentials
 */
export async function fetchSupabaseData(supabaseUrl: string, supabaseKey: string) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch all data from kv_store table
    const response = await fetch(`${supabaseUrl}/rest/v1/kv_store_b9ff1a07?select=*`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Supabase data:', error);
    throw error;
  }
}

/**
 * Transform Supabase data to local format
 */
function transformData(supabaseData: any[]) {
  const prompts: Prompt[] = [];
  const artworks: Artwork[] = [];

  for (const item of supabaseData) {
    const { key, value } = item;

    // Process prompts
    if (key.startsWith('prompt_')) {
      const promptData = value as SupabasePrompt;
      prompts.push({
        id: promptData.id || key,
        prompt: promptData.prompt,
        email: promptData.email,
        status: (promptData.status || 'pending') as 'pending' | 'completed' | 'in_progress',
        createdAt: promptData.timestamp,
        completedAt: promptData.completedAt,
        artworkId: promptData.artworkId,
        promptNumber: promptData.promptNumber,
      });
    }

    // Process artworks
    if (key.startsWith('artwork_') || key.startsWith('gallery_')) {
      const artworkData = value as SupabaseArtwork;
      artworks.push({
        id: artworkData.id || key,
        promptId: artworkData.promptId,
        promptNumber: artworkData.promptNumber || 0,
        imageData: artworkData.imageData || artworkData.imageUrl || '',
        artistName: artworkData.artistName,
        status: (artworkData.status || 'approved') as 'pending' | 'approved' | 'rejected',
        createdAt: artworkData.timestamp,
        approvedAt: artworkData.approvedAt,
        isAdminCreated: artworkData.type === 'admin_artwork',
      });
    }
  }

  return { prompts, artworks };
}

/**
 * Main import function
 */
export async function importFromSupabase(supabaseUrl: string, supabaseKey: string) {
  try {
    console.log('[Import] Fetching data from Supabase...');
    const supabaseData = await fetchSupabaseData(supabaseUrl, supabaseKey);

    console.log('[Import] Transforming data...');
    const { prompts, artworks } = transformData(supabaseData);

    console.log(`[Import] Found ${prompts.length} prompts and ${artworks.length} artworks`);

    console.log('[Import] Importing to local database...');
    await importData({ prompts, artworks });

    console.log('[Import] Import completed successfully!');
    return { prompts: prompts.length, artworks: artworks.length };
  } catch (error) {
    console.error('[Import] Import failed:', error);
    throw error;
  }
}

/**
 * Helper function to run import from browser console
 * Usage: window.importFromSupabase('your-url', 'your-key')
 */
if (typeof window !== 'undefined') {
  (window as any).importFromSupabase = importFromSupabase;
}
