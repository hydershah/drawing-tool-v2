/**
 * Fix pending artwork URLs to use public CDN domain
 */

import { db, schema } from './db';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const OLD_DOMAIN = 'https://3d54799d7ab363c91cb08294e54312d5.r2.cloudflarestorage.com/drawing';
const NEW_DOMAIN = 'https://pub-18810369459947499c64f850f273396b.r2.dev';

async function fixPendingUrls() {
  console.log('🔧 Fixing pending artwork URLs...');

  try {
    // Get all pending artworks
    const pendingArtworks = await db
      .select()
      .from(schema.artworks)
      .where(eq(schema.artworks.status, 'pending'));

    console.log(`Found ${pendingArtworks.length} pending artworks`);

    for (const artwork of pendingArtworks) {
      if (artwork.imageUrl && artwork.imageUrl.includes(OLD_DOMAIN)) {
        const newUrl = artwork.imageUrl.replace(OLD_DOMAIN, NEW_DOMAIN);

        console.log(`Updating ${artwork.id}:`);
        console.log(`  Old: ${artwork.imageUrl}`);
        console.log(`  New: ${newUrl}`);

        await db
          .update(schema.artworks)
          .set({ imageUrl: newUrl })
          .where(eq(schema.artworks.id, artwork.id));

        console.log(`✅ Updated ${artwork.id}`);
      }
    }

    console.log('✅ All pending artwork URLs fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    process.exit(1);
  }
}

fixPendingUrls();
