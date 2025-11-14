/**
 * Migration Script: Migrate Artwork Images from Base64 to Cloudflare R2
 * Run this script to upload all existing base64 images to R2 and update the database
 */

import { db } from './db';
import { artworks } from './schema';
import { eq, isNotNull, isNull } from 'drizzle-orm';
import r2Storage from './r2-storage';
import { clearAllCache } from './redis';
import dotenv from 'dotenv';

dotenv.config();

interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ artworkId: string; error: string }>;
}

async function migrateArtworkToR2(artwork: any): Promise<boolean> {
  try {
    // Skip if already migrated
    if (artwork.imageUrl) {
      console.log(`⏭️ Skipping ${artwork.id} - already migrated`);
      return false;
    }

    // Skip if no image data
    if (!artwork.imageData) {
      console.log(`⏭️ Skipping ${artwork.id} - no image data`);
      return false;
    }

    console.log(`📤 Migrating artwork ${artwork.id}...`);

    // Upload to R2 with optimization
    const uploadResult = await r2Storage.uploadBase64Image(
      artwork.imageData,
      artwork.id,
      {
        optimize: true,  // Convert to WebP and resize if needed
        maxWidth: 2000,   // Max width of 2000px
        quality: 85,      // 85% quality for good balance
      }
    );

    if (!uploadResult.success) {
      console.error(`❌ Failed to upload ${artwork.id}: ${uploadResult.error}`);
      return false;
    }

    // Update database with new URL and key
    await db
      .update(artworks)
      .set({
        imageUrl: uploadResult.url,
        imageKey: uploadResult.key,
        // Keep imageData for now as backup (can be nulled out later)
      })
      .where(eq(artworks.id, artwork.id));

    console.log(`✅ Migrated ${artwork.id} to R2: ${uploadResult.url}`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating ${artwork.id}:`, error);
    return false;
  }
}

async function runMigration(options: {
  batchSize?: number;
  clearBase64After?: boolean;
  limit?: number;
} = {}) {
  const { batchSize = 10, clearBase64After = false, limit } = options;

  console.log('🚀 Starting R2 migration...');
  console.log(`Options: batchSize=${batchSize}, clearBase64After=${clearBase64After}, limit=${limit || 'all'}`);

  const stats: MigrationStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get all artworks that need migration
    let query = db
      .select()
      .from(artworks)
      .where(isNotNull(artworks.imageData));

    if (limit) {
      query = query.limit(limit);
    }

    const artworksToMigrate = await query;
    stats.total = artworksToMigrate.length;

    console.log(`Found ${stats.total} artworks to migrate`);

    // Process in batches
    for (let i = 0; i < artworksToMigrate.length; i += batchSize) {
      const batch = artworksToMigrate.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(artworksToMigrate.length / batchSize);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches}`);

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(async (artwork) => {
          const success = await migrateArtworkToR2(artwork);
          if (success) {
            stats.successful++;
          } else if (artwork.imageUrl) {
            stats.skipped++;
          } else {
            stats.failed++;
            stats.errors.push({
              artworkId: artwork.id,
              error: 'Migration failed',
            });
          }
          return success;
        })
      );

      console.log(`Batch ${batchNumber} complete: ${results.filter(r => r).length}/${batch.length} successful`);

      // Add a small delay between batches to avoid overwhelming the server
      if (i + batchSize < artworksToMigrate.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Optional: Clear base64 data after successful migration
    if (clearBase64After && stats.successful > 0) {
      console.log('\n🧹 Clearing base64 data for migrated artworks...');

      const clearedCount = await db
        .update(artworks)
        .set({ imageData: null })
        .where(isNotNull(artworks.imageUrl));

      console.log(`✅ Cleared base64 data from ${stats.successful} artworks`);
    }

    // Clear Redis cache to force refresh with new URLs
    console.log('\n🔄 Clearing Redis cache...');
    await clearAllCache();
    console.log('✅ Redis cache cleared');

    // Print final statistics
    console.log('\n📊 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`Total artworks: ${stats.total}`);
    console.log(`Successfully migrated: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Skipped (already migrated): ${stats.skipped}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => {
        console.log(`  - ${error.artworkId}: ${error.error}`);
      });
    }

    return stats;
  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: any = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--clear-base64') {
      options.clearBase64After = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    }
  });

  console.log('🎨 Artwork Image Migration to Cloudflare R2');
  console.log('='.repeat(50));

  runMigration(options)
    .then(() => {
      console.log('\n✨ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration, migrateArtworkToR2 };