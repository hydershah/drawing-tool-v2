/**
 * Import data from Supabase to local PostgreSQL
 */

import { db } from './src/db';
import { prompts, artworks } from './src/schema';

const SUPABASE_URL = 'https://hebruzjorytvlxquacxe.supabase.co/functions/v1/make-server-b9ff1a07';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYnJ1empvcnl0dmx4cXVhY3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODA3NDMsImV4cCI6MjA3NzM1Njc0M30.bz02LZq73iy5Id1k4cuq2hNcjM8yMEFREAQpXtZGYLQ';

async function fetchFromSupabase(endpoint: string) {
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }

  return await response.json();
}

async function importData() {
  console.log('[Import] Starting import from Supabase...');

  try {
    // Fetch prompts
    console.log('[Import] Fetching prompts...');
    const promptsResponse = await fetchFromSupabase('prompts');
    const promptsData = promptsResponse.submissions || promptsResponse.data || promptsResponse.prompts || [];
    console.log(`[Import] Found ${promptsData.length} prompts`);

    // Insert prompts
    if (promptsData.length > 0) {
      for (const p of promptsData) {
        await db.insert(prompts).values({
          id: p.id,
          prompt: p.prompt,
          email: p.email || '',
          status: p.status || 'pending',
          promptNumber: p.promptNumber || p.prompt_number || null,
          createdAt: p.timestamp ? new Date(p.timestamp) : (p.createdAt ? new Date(p.createdAt) : new Date()),
          completedAt: p.completedAt ? new Date(p.completedAt) : null,
          artworkId: p.artworkId || p.artwork_id || null,
        }).onConflictDoNothing();
      }
      console.log(`[Import] Imported ${promptsData.length} prompts`);
    }

    // Fetch artworks (with pagination to avoid timeout)
    console.log('[Import] Fetching artworks in batches...');
    let allArtworks: any[] = [];
    let offset = 0;
    const batchSize = 20;

    while (true) {
      try {
        const artworksResponse = await fetchFromSupabase(`artworks?limit=${batchSize}&offset=${offset}`);
        const batch = artworksResponse.artworks || artworksResponse.data || [];

        if (batch.length === 0) break;

        allArtworks = allArtworks.concat(batch);
        console.log(`[Import] Fetched ${allArtworks.length} artworks so far...`);
        offset += batchSize;

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Import] Error fetching artworks batch at offset ${offset}:`, error);
        break;
      }
    }

    console.log(`[Import] Total artworks fetched: ${allArtworks.length}`);

    // Insert artworks
    if (allArtworks.length > 0) {
      for (const a of allArtworks) {
        await db.insert(artworks).values({
          id: a.id,
          promptId: a.promptId || a.prompt_id || null,
          promptNumber: a.promptNumber || a.prompt_number || 0,
          imageData: a.imageData || a.image_data || a.imageurl || a.image_url || '',
          artistName: a.artistName || a.artist_name || null,
          artistEmail: a.artistEmail || a.artist_email || null,
          status: a.status || 'approved',
          isAdminCreated: a.isAdminCreated || a.is_admin_created || false,
          createdAt: a.createdAt ? new Date(a.createdAt) : (a.created_at ? new Date(a.created_at) : new Date()),
          approvedAt: a.approvedAt ? new Date(a.approvedAt) : (a.approved_at ? new Date(a.approved_at) : null),
        }).onConflictDoNothing();
      }
      console.log(`[Import] Imported ${allArtworks.length} artworks`);
    }

    console.log('[Import] ✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Import] ❌ Import failed:', error);
    process.exit(1);
  }
}

importData();
