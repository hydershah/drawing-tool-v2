/**
 * Script to generate public R2.dev URLs for existing images
 * This updates the database with the correct public URLs
 */

import { db } from './db';
import { artworks } from './schema';
import { isNotNull, eq } from 'drizzle-orm';
import { clearAllCache } from './redis';
import dotenv from 'dotenv';

dotenv.config();

async function updateImageUrls() {
  console.log('🔄 Updating image URLs to use R2 public domain...');

  const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

  if (!R2_PUBLIC_DOMAIN || R2_PUBLIC_DOMAIN === 'YOUR-BUCKET-ID.r2.dev') {
    console.error('❌ R2_PUBLIC_DOMAIN not configured in .env');
    console.log('Please set R2_PUBLIC_DOMAIN to your R2.dev subdomain');
    return;
  }

  console.log(`📌 Using R2 public domain: ${R2_PUBLIC_DOMAIN}`);

  // Get all artworks with imageKey (these have been migrated to R2)
  const artworksWithKeys = await db
    .select()
    .from(artworks)
    .where(isNotNull(artworks.imageKey));

  console.log(`Found ${artworksWithKeys.length} artworks with R2 keys`);

  let updated = 0;
  let skipped = 0;

  for (const artwork of artworksWithKeys) {
    if (artwork.imageKey) {
      // Construct the public URL using the R2 public domain
      const publicUrl = `https://${R2_PUBLIC_DOMAIN}/${artwork.imageKey}`;

      // Check if URL needs updating (skip if already using correct domain)
      if (artwork.imageUrl && artwork.imageUrl.includes(R2_PUBLIC_DOMAIN)) {
        skipped++;
        console.log(`⏭️  Skipped ${artwork.id} - already using correct domain`);
        continue;
      }

      // Update the database
      await db
        .update(artworks)
        .set({ imageUrl: publicUrl })
        .where(eq(artworks.id, artwork.id));

      updated++;
      console.log(`✅ Updated ${artwork.id}: ${publicUrl}`);
    }
  }

  // Clear cache to force refresh
  await clearAllCache();

  console.log(`\n📊 Summary:`);
  console.log(`✅ Updated ${updated} artwork URLs`);
  console.log(`⏭️  Skipped ${skipped} (already correct)`);
  console.log(`\n🎉 All images now using R2 public domain!`);
}

// Run if called directly
if (require.main === module) {
  updateImageUrls()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { updateImageUrls };