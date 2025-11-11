/**
 * IndexedDB Database Configuration using Dexie
 * Fast, local, browser-based database for storing prompts, artworks, and site content
 */

import Dexie, { type EntityTable } from 'dexie';
import type { Prompt, Artwork, SiteContent } from '@/types';

/**
 * Database schema interface
 */
interface DrawingToolDatabase extends Dexie {
  prompts: EntityTable<Prompt, 'id'>;
  artworks: EntityTable<Artwork, 'id'>;
  siteContent: EntityTable<SiteContent & { id: string }, 'id'>;
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
