/**
 * IndexedDB Database Configuration using Dexie
 * Fast, local, browser-based database for storing prompts, artworks, and site content
 */

import Dexie, { type EntityTable } from 'dexie';
import type { Prompt, Artwork, SiteContent } from '@/types';

/**
 * Cache metadata for tracking freshness
 */
interface CacheMetadata {
  id: string;
  lastFetched: number;
}

/**
 * Database schema interface
 */
interface DrawingToolDatabase extends Dexie {
  prompts: EntityTable<Prompt, 'id'>;
  artworks: EntityTable<Artwork, 'id'>;
  siteContent: EntityTable<SiteContent & { id: string }, 'id'>;
  cacheMetadata: EntityTable<CacheMetadata, 'id'>;
}

/**
 * Initialize and configure the database
 */
export const db = new Dexie('DrawingToolDB') as DrawingToolDatabase;

// Define database schema
db.version(1).stores({
  prompts: 'id, email, status, createdAt, completedAt, promptNumber',
  artworks: 'id, promptId, promptNumber, status, createdAt, approvedAt, isAdminCreated',
  siteContent: 'id',
});

// Add cache metadata table in version 2
db.version(2).stores({
  prompts: 'id, email, status, createdAt, completedAt, promptNumber',
  artworks: 'id, promptId, promptNumber, status, createdAt, approvedAt, isAdminCreated',
  siteContent: 'id',
  cacheMetadata: 'id, lastFetched',
});

/**
 * Database initialization and migration
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Open database
    await db.open();

    // Check if siteContent exists, if not create default
    const siteContentCount = await db.siteContent.count();
    if (siteContentCount === 0) {
      await db.siteContent.add({
        id: 'default',
        projectTitle: 'Drawing Tool',
        projectDescription: 'Submit prompts and receive custom artwork',
      });
    }

    console.log('[Database] Initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

/**
 * Clear all database data (for development/testing)
 */
export async function clearDatabase(): Promise<void> {
  await db.prompts.clear();
  await db.artworks.clear();
  // Don't clear siteContent as it contains configuration
}

/**
 * Export all data (for backup/debugging)
 */
export async function exportAllData() {
  const [prompts, artworks, siteContent] = await Promise.all([
    db.prompts.toArray(),
    db.artworks.toArray(),
    db.siteContent.toArray(),
  ]);

  return {
    prompts,
    artworks,
    siteContent: siteContent[0] || null,
  };
}

/**
 * Import data from JSON (for migration/restoration)
 */
export async function importData(data: {
  prompts?: Prompt[];
  artworks?: Artwork[];
  siteContent?: SiteContent;
}): Promise<void> {
  try {
    if (data.prompts) {
      await db.prompts.bulkAdd(data.prompts);
    }

    if (data.artworks) {
      await db.artworks.bulkAdd(data.artworks);
    }

    if (data.siteContent) {
      await db.siteContent.put({
        id: 'default',
        ...data.siteContent,
      });
    }

    console.log('[Database] Data imported successfully');
  } catch (error) {
    console.error('[Database] Import error:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [promptCount, artworkCount, approvedCount, pendingCount] = await Promise.all([
    db.prompts.count(),
    db.artworks.count(),
    db.artworks.where('status').equals('approved').count(),
    db.artworks.where('status').equals('pending').count(),
  ]);

  return {
    totalPrompts: promptCount,
    totalArtworks: artworkCount,
    approvedArtworks: approvedCount,
    pendingArtworks: pendingCount,
  };
}

/**
 * Cache Management Functions
 */

// Cache TTL (Time To Live) - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if cached data is still fresh
 */
export async function isCacheFresh(cacheKey: string): Promise<boolean> {
  const metadata = await db.cacheMetadata.get(cacheKey);
  if (!metadata) return false;

  const age = Date.now() - metadata.lastFetched;
  return age < CACHE_TTL;
}

/**
 * Update cache timestamp
 */
export async function updateCacheMetadata(cacheKey: string): Promise<void> {
  await db.cacheMetadata.put({
    id: cacheKey,
    lastFetched: Date.now(),
  });
}

/**
 * Get cached prompts if fresh, otherwise return null
 */
export async function getCachedPrompts(): Promise<Prompt[] | null> {
  const isFresh = await isCacheFresh('prompts');
  if (!isFresh) return null;

  const prompts = await db.prompts.toArray();
  return prompts.length > 0 ? prompts : null;
}

/**
 * Cache prompts in IndexedDB
 */
export async function cachePrompts(prompts: Prompt[]): Promise<void> {
  // Clear existing prompts and add new ones
  await db.prompts.clear();
  await db.prompts.bulkAdd(prompts);
  await updateCacheMetadata('prompts');
  console.log(`[Cache] Stored ${prompts.length} prompts`);
}

/**
 * Invalidate prompts cache (forces fresh fetch on next request)
 */
export async function invalidatePromptsCache(): Promise<void> {
  await db.cacheMetadata.delete('prompts');
  console.log('[Cache] Prompts cache invalidated');
}
