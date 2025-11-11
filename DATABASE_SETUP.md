# Database Setup - Drawing Tool V2

## Overview

Drawing Tool V2 now uses **IndexedDB** with **Dexie.js** for fast, local browser storage instead of Supabase.

### Why IndexedDB?

- ⚡ **Fastest local option** - No network latency, instant reads/writes
- 💾 **Large storage** - Can store hundreds of MB of data (artworks with base64 images)
- 🔒 **Privacy** - All data stays on the user's device
- 📴 **Offline-first** - Works without internet connection
- 💰 **Zero cost** - No cloud database fees
- 🚀 **Better performance** - Indexed queries, bulk operations

## Database Structure

### Tables

1. **prompts** - User submitted prompts
   - `id` (primary key)
   - `prompt` (text)
   - `email` (indexed)
   - `status` (indexed) - 'pending' | 'completed' | 'in_progress'
   - `createdAt` (indexed)
   - `completedAt`
   - `artworkId`
   - `promptNumber`

2. **artworks** - Submitted artworks
   - `id` (primary key)
   - `promptId` (indexed)
   - `promptNumber` (indexed)
   - `imageData` (base64 encoded image)
   - `artistName`
   - `artistEmail`
   - `status` (indexed) - 'pending' | 'approved' | 'rejected'
   - `createdAt` (indexed)
   - `approvedAt`
   - `isAdminCreated` (indexed)

3. **siteContent** - Site configuration
   - `id` (always 'default')
   - `projectTitle`
   - `projectDescription`
   - `bookLink`
   - `bookTitle`

## Files Created

### Core Database Files

- **`src/services/database.ts`** - Dexie database configuration and initialization
- **`src/services/storage.ts`** - Updated to use IndexedDB instead of localStorage
- **`src/contexts/AppContext.tsx`** - Updated to handle async database operations

### Utility Files

- **`src/utils/importFromSupabase.ts`** - Import data from Supabase
- **`IMPORT_DATA.md`** - Instructions for data migration
- **`DATABASE_SETUP.md`** - This file

## Usage

### Starting the App

The database is automatically initialized when the app starts:

```bash
npm run dev
```

### Accessing Database in Code

```typescript
import { db } from '@/services/database';
import { promptStorage, artworkStorage } from '@/services/storage';

// Get all prompts
const prompts = await promptStorage.getAll();

// Add a new prompt
const newPrompt = await promptStorage.create('Draw a cat', 'user@example.com');

// Query artworks by status
const approved = await db.artworks
  .where('status')
  .equals('approved')
  .toArray();
```

### Browser Console Commands

```javascript
// View database stats
import('/src/services/database.ts').then(m => m.getDatabaseStats().then(console.log));

// Export all data
import('/src/services/storage.ts').then(m => m.exportAllData().then(console.log));

// Clear all data
import('/src/services/storage.ts').then(m => m.clearAllData());

// Import from Supabase
import('/src/utils/importFromSupabase.ts').then(m => {
  m.importFromSupabase('SUPABASE_URL', 'SUPABASE_KEY');
});
```

## Performance Comparison

### Before (localStorage)
- ❌ Synchronous blocking operations
- ❌ 5-10MB storage limit
- ❌ No indexing or queries
- ❌ Slow with large datasets
- ❌ Serialization overhead

### After (IndexedDB)
- ✅ Asynchronous non-blocking
- ✅ 50MB+ storage (browser dependent)
- ✅ Indexed queries (fast lookups)
- ✅ Optimized for large datasets
- ✅ Efficient binary storage
- ✅ Transactional (data integrity)

## Migration from Supabase

See [IMPORT_DATA.md](./IMPORT_DATA.md) for detailed instructions on importing your existing Supabase data.

Quick steps:
1. Run `npm run dev`
2. Open browser console
3. Execute import command with your Supabase credentials
4. Verify data imported successfully

## Database Administration

### View All Data
```javascript
// In browser console
import('/src/services/database.ts').then(async (m) => {
  const data = await m.exportAllData();
  console.table(data.prompts);
  console.table(data.artworks);
  console.log(data.siteContent);
});
```

### Backup Data
```javascript
// Download backup as JSON file
import('/src/services/storage.ts').then(async (m) => {
  const data = await m.exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${Date.now()}.json`;
  a.click();
});
```

### Restore from Backup
```javascript
// Restore from JSON file
import('/src/services/database.ts').then(async (m) => {
  const data = {
    prompts: [...], // your backup data
    artworks: [...],
    siteContent: {...}
  };
  await m.importData(data);
  console.log('Restore complete');
});
```

## Troubleshooting

### "Database initialization failed"
- Clear browser data and refresh
- Check browser console for specific errors
- Ensure browser supports IndexedDB (all modern browsers do)

### Data not persisting
- Check if browser is in private/incognito mode
- Verify storage isn't full
- Check browser storage settings

### Slow performance
- Run `db.prompts.clear()` to remove test data
- Check if you have thousands of large images
- Consider pagination for large datasets

## Future Enhancements

Possible improvements:
- [ ] Sync with cloud backup
- [ ] Export/import to JSON
- [ ] Database versioning for migrations
- [ ] Full-text search on prompts
- [ ] Image compression for artworks
- [ ] Automatic cleanup of old data
- [ ] Multi-device sync

## Support

For issues or questions:
1. Check the console for error messages
2. Review [IMPORT_DATA.md](./IMPORT_DATA.md)
3. Clear database and try again
4. Report issues with full error logs
