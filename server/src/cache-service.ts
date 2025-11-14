import { db } from './db';
import { prompts, artworks, siteContent } from './schema';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';
import {
  cacheGet,
  cacheSet,
  cacheWrapper,
  cacheDel,
  CACHE_KEYS,
  CACHE_TTL,
  invalidatePromptsCache,
  invalidateArtworksCache,
  invalidateSiteContentCache,
} from './redis';
import r2Storage from './r2-storage';

/**
 * Prompts Cache Service
 */
export class PromptsCache {
  /**
   * Get all prompts with caching
   */
  static async getAll(limit: number = 100, offset: number = 0) {
    const key = limit === 1000 && offset === 0
      ? CACHE_KEYS.PROMPTS_ALL
      : `prompts:list:${limit}:${offset}`;

    return cacheWrapper(
      key,
      async () => {
        const promptsList = await db
          .select()
          .from(prompts)
          .orderBy(desc(prompts.promptNumber))
          .limit(limit)
          .offset(offset);

        return promptsList;
      },
      CACHE_TTL.PROMPTS_LIST
    );
  }

  /**
   * Get pending prompts with caching
   */
  static async getPending() {
    return cacheWrapper(
      CACHE_KEYS.PROMPTS_PENDING,
      async () => {
        const pendingPrompts = await db
          .select()
          .from(prompts)
          .where(eq(prompts.status, 'pending'))
          .orderBy(desc(prompts.promptNumber));

        return pendingPrompts;
      },
      CACHE_TTL.PROMPTS_LIST
    );
  }

  /**
   * Get completed prompts with caching
   */
  static async getCompleted() {
    return cacheWrapper(
      CACHE_KEYS.PROMPTS_COMPLETED,
      async () => {
        const completedPrompts = await db
          .select()
          .from(prompts)
          .where(eq(prompts.status, 'completed'))
          .orderBy(desc(prompts.completedAt));

        return completedPrompts;
      },
      CACHE_TTL.PROMPTS_LIST
    );
  }

  /**
   * Get single prompt by ID with caching
   */
  static async getById(id: string) {
    return cacheWrapper(
      CACHE_KEYS.PROMPT(id),
      async () => {
        const prompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, id))
          .limit(1);

        return prompt[0] || null;
      },
      CACHE_TTL.SINGLE_ITEM
    );
  }

  /**
   * Get next prompt number with caching
   */
  static async getNextNumber() {
    return cacheWrapper(
      CACHE_KEYS.NEXT_PROMPT_NUMBER,
      async () => {
        const result = await db
          .select({ maxNumber: sql`COALESCE(MAX(${prompts.promptNumber}), 0)` })
          .from(prompts);

        const nextNumber = (result[0]?.maxNumber as number || 0) + 1;
        return nextNumber;
      },
      CACHE_TTL.NEXT_NUMBER
    );
  }

  /**
   * Create new prompt and invalidate cache
   */
  static async create(promptData: any) {
    const result = await db.insert(prompts).values(promptData).returning();

    // Invalidate related caches
    await invalidatePromptsCache();

    return result[0];
  }

  /**
   * Update prompt and invalidate cache
   */
  static async update(id: string, updates: any) {
    const result = await db
      .update(prompts)
      .set(updates)
      .where(eq(prompts.id, id))
      .returning();

    // Invalidate specific and list caches
    await cacheDel(CACHE_KEYS.PROMPT(id));
    await invalidatePromptsCache();

    return result[0];
  }

  /**
   * Mark prompt as completed and invalidate cache
   */
  static async markCompleted(id: string, artworkId: string | null = null) {
    const result = await db
      .update(prompts)
      .set({
        status: 'completed',
        completedAt: new Date(),
        artworkId: artworkId,
      })
      .where(eq(prompts.id, id))
      .returning();

    // Invalidate caches
    await cacheDel(CACHE_KEYS.PROMPT(id));
    await invalidatePromptsCache();

    return result[0];
  }

  /**
   * Delete prompt and invalidate cache
   */
  static async delete(id: string) {
    const result = await db
      .delete(prompts)
      .where(eq(prompts.id, id))
      .returning();

    // Invalidate caches
    await cacheDel(CACHE_KEYS.PROMPT(id));
    await invalidatePromptsCache();

    return result[0];
  }

  /**
   * Get prompts statistics with caching
   */
  static async getStats() {
    return cacheWrapper(
      CACHE_KEYS.STATS_PROMPTS,
      async () => {
        const [total, pending, completed] = await Promise.all([
          db.select({ count: sql`COUNT(*)` }).from(prompts),
          db
            .select({ count: sql`COUNT(*)` })
            .from(prompts)
            .where(eq(prompts.status, 'pending')),
          db
            .select({ count: sql`COUNT(*)` })
            .from(prompts)
            .where(eq(prompts.status, 'completed')),
        ]);

        return {
          total: Number(total[0].count),
          pending: Number(pending[0].count),
          completed: Number(completed[0].count),
        };
      },
      CACHE_TTL.PROMPTS_LIST
    );
  }
}

/**
 * Artworks Cache Service
 */
export class ArtworksCache {
  /**
   * Get all artworks with caching
   */
  static async getAll(limit: number = 100, offset: number = 0) {
    const key = `artworks:list:${limit}:${offset}`;

    return cacheWrapper(
      key,
      async () => {
        const artworksList = await db
          .select()
          .from(artworks)
          .orderBy(desc(artworks.createdAt))
          .limit(limit)
          .offset(offset);

        // Return imageUrl instead of imageData when available
        const processedArtworks = artworksList.map(artwork => {
          if (artwork.imageUrl) {
            return {
              ...artwork,
              imageData: undefined,
              image: artwork.imageUrl,
            };
          }
          return artwork;
        });

        return processedArtworks;
      },
      CACHE_TTL.ARTWORK_LIST
    );
  }

  /**
   * Get approved artworks with permanent caching
   */
  static async getApproved() {
    return cacheWrapper(
      CACHE_KEYS.ARTWORKS_APPROVED,
      async () => {
        console.log('📸 Fetching approved artworks from database (this should be rare)...');
        const approvedArtworks = await db
          .select()
          .from(artworks)
          .where(eq(artworks.status, 'approved'))
          .orderBy(desc(artworks.approvedAt));

        // Return imageUrl instead of imageData when available
        const processedArtworks = approvedArtworks.map(artwork => {
          if (artwork.imageUrl) {
            // If we have a URL, don't send base64 data
            return {
              ...artwork,
              imageData: undefined, // Remove base64 data
              image: artwork.imageUrl, // Provide URL as 'image' field
            };
          }
          return artwork;
        });

        console.log(`✅ Cached ${processedArtworks.length} approved artworks permanently in Redis`);
        return processedArtworks;
      },
      CACHE_TTL.ARTWORK_APPROVED // 0 = permanent cache
    );
  }

  /**
   * Get pending artworks with caching
   */
  static async getPending() {
    return cacheWrapper(
      CACHE_KEYS.ARTWORKS_PENDING,
      async () => {
        const pendingArtworks = await db
          .select()
          .from(artworks)
          .where(eq(artworks.status, 'pending'))
          .orderBy(desc(artworks.createdAt));

        return pendingArtworks;
      },
      CACHE_TTL.ARTWORK_LIST
    );
  }

  /**
   * Get single artwork by ID with caching
   */
  static async getById(id: string) {
    return cacheWrapper(
      CACHE_KEYS.ARTWORK(id),
      async () => {
        const artwork = await db
          .select()
          .from(artworks)
          .where(eq(artworks.id, id))
          .limit(1);

        return artwork[0] || null;
      },
      CACHE_TTL.SINGLE_ITEM
    );
  }

  /**
   * Get next artwork number with caching
   */
  static async getNextNumber() {
    return cacheWrapper(
      CACHE_KEYS.NEXT_ARTWORK_NUMBER,
      async () => {
        const result = await db
          .select({ maxNumber: sql`COALESCE(MAX(${artworks.promptNumber}), 0)` })
          .from(artworks)
          .where(eq(artworks.isAdminCreated, false));

        const nextNumber = (result[0]?.maxNumber as number || 0) + 1;
        return nextNumber;
      },
      CACHE_TTL.NEXT_NUMBER
    );
  }

  /**
   * Create new artwork and invalidate cache
   */
  static async create(artworkData: any) {
    // If base64 image data is provided, upload to R2
    if (artworkData.imageData && artworkData.imageData.startsWith('data:image')) {
      console.log('📤 Uploading new artwork image to R2...');
      const uploadResult = await r2Storage.uploadBase64Image(
        artworkData.imageData,
        artworkData.id,
        {
          optimize: true,
          maxWidth: 2000,
          quality: 85,
        }
      );

      if (uploadResult.success) {
        // Replace base64 with URL
        artworkData.imageUrl = uploadResult.url;
        artworkData.imageKey = uploadResult.key;
        artworkData.imageData = null; // Don't store base64 anymore
        console.log(`✅ Image uploaded to R2: ${uploadResult.url}`);
      } else {
        console.error('Failed to upload to R2, falling back to base64:', uploadResult.error);
      }
    }

    const result = await db.insert(artworks).values(artworkData).returning();

    // Invalidate related caches
    await invalidateArtworksCache();

    // If artwork is linked to a prompt, mark it as completed
    if (artworkData.promptId) {
      await PromptsCache.markCompleted(artworkData.promptId, result[0].id);
    }

    return result[0];
  }

  /**
   * Approve artwork and invalidate cache
   */
  static async approve(id: string) {
    const result = await db
      .update(artworks)
      .set({
        status: 'approved',
        approvedAt: new Date(),
      })
      .where(eq(artworks.id, id))
      .returning();

    // Invalidate caches - force refresh of approved artworks
    await cacheDel(CACHE_KEYS.ARTWORK(id));
    await cacheDel(CACHE_KEYS.ARTWORKS_APPROVED); // Clear permanent cache to force refresh
    await cacheDel(CACHE_KEYS.ARTWORKS_PENDING);
    console.log('🔄 Cleared approved artworks cache - will refresh on next request');

    return result[0];
  }

  /**
   * Reject artwork and invalidate cache
   */
  static async reject(id: string) {
    const result = await db
      .update(artworks)
      .set({
        status: 'rejected',
      })
      .where(eq(artworks.id, id))
      .returning();

    // Invalidate caches
    await cacheDel(CACHE_KEYS.ARTWORK(id));
    await invalidateArtworksCache();

    return result[0];
  }

  /**
   * Delete artwork and invalidate cache
   */
  static async delete(id: string) {
    // First check if the artwork was approved and has an R2 image
    const artwork = await db
      .select()
      .from(artworks)
      .where(eq(artworks.id, id))
      .limit(1);

    const wasApproved = artwork[0]?.status === 'approved';
    const imageKey = artwork[0]?.imageKey;

    // Delete from R2 if image exists there
    if (imageKey) {
      console.log(`🗑️ Deleting image from R2: ${imageKey}`);
      const deleted = await r2Storage.deleteImage(imageKey);
      if (deleted) {
        console.log('✅ Image deleted from R2');
      } else {
        console.error('⚠️ Failed to delete image from R2');
      }
    }

    const result = await db
      .delete(artworks)
      .where(eq(artworks.id, id))
      .returning();

    // Invalidate caches
    await cacheDel(CACHE_KEYS.ARTWORK(id));

    // If it was approved, clear the permanent approved cache
    if (wasApproved) {
      await cacheDel(CACHE_KEYS.ARTWORKS_APPROVED);
      console.log('🔄 Cleared approved artworks cache after deletion');
    }

    await cacheDel(CACHE_KEYS.ARTWORKS_PENDING);

    return result[0];
  }

  /**
   * Get artworks statistics with caching
   */
  static async getStats() {
    return cacheWrapper(
      CACHE_KEYS.STATS_ARTWORKS,
      async () => {
        const [total, approved, pending, rejected] = await Promise.all([
          db.select({ count: sql`COUNT(*)` }).from(artworks),
          db
            .select({ count: sql`COUNT(*)` })
            .from(artworks)
            .where(eq(artworks.status, 'approved')),
          db
            .select({ count: sql`COUNT(*)` })
            .from(artworks)
            .where(eq(artworks.status, 'pending')),
          db
            .select({ count: sql`COUNT(*)` })
            .from(artworks)
            .where(eq(artworks.status, 'rejected')),
        ]);

        return {
          total: Number(total[0].count),
          approved: Number(approved[0].count),
          pending: Number(pending[0].count),
          rejected: Number(rejected[0].count),
        };
      },
      CACHE_TTL.ARTWORK_LIST
    );
  }
}

/**
 * Site Content Cache Service
 */
export class SiteContentCache {
  /**
   * Get site content with caching
   */
  static async get() {
    return cacheWrapper(
      CACHE_KEYS.SITE_CONTENT,
      async () => {
        const content = await db
          .select()
          .from(siteContent)
          .where(eq(siteContent.id, 'default'))
          .limit(1);

        if (!content[0]) {
          // Return default content if not found
          return {
            id: 'default',
            projectTitle: 'Community Drawing Tool',
            projectDescription: 'A collaborative drawing experience',
            bookLink: null,
            bookTitle: null,
            updatedAt: new Date(),
          };
        }

        return content[0];
      },
      CACHE_TTL.SITE_CONTENT
    );
  }

  /**
   * Update site content and invalidate cache
   */
  static async update(updates: any) {
    const result = await db
      .update(siteContent)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(siteContent.id, 'default'))
      .returning();

    // If no rows updated, insert new
    if (!result[0]) {
      const insertResult = await db
        .insert(siteContent)
        .values({
          id: 'default',
          ...updates,
          updatedAt: new Date(),
        })
        .returning();

      // Invalidate cache
      await invalidateSiteContentCache();
      return insertResult[0];
    }

    // Invalidate cache
    await invalidateSiteContentCache();
    return result[0];
  }
}

/**
 * Batch operations with cache warming
 */
export class CacheWarmer {
  /**
   * Warm all critical caches
   */
  static async warmAll() {
    console.log('🔥 Warming up caches...');

    await Promise.all([
      PromptsCache.getAll(1000, 0),
      PromptsCache.getPending(),
      ArtworksCache.getApproved(),
      ArtworksCache.getPending(),
      SiteContentCache.get(),
    ]);

    console.log('✅ Cache warming complete');
  }

  /**
   * Refresh specific cache types
   */
  static async refreshPrompts() {
    await invalidatePromptsCache();
    await PromptsCache.getAll(1000, 0);
    await PromptsCache.getPending();
  }

  static async refreshArtworks() {
    await invalidateArtworksCache();
    await ArtworksCache.getApproved();
    await ArtworksCache.getPending();
  }
}

export default {
  prompts: PromptsCache,
  artworks: ArtworksCache,
  siteContent: SiteContentCache,
  warmer: CacheWarmer,
};