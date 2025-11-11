# Switching from IndexedDB to PostgreSQL

This guide helps you switch from the local IndexedDB database to the PostgreSQL backend.

## Why Switch?

**IndexedDB (Current):**
- ✅ Fast (local)
- ✅ Works offline
- ✅ No setup required
- ❌ Data isolated per device
- ❌ Can't share between users
- ❌ No backup/sync

**PostgreSQL (New):**
- ✅ Shared database (all users see same data)
- ✅ Works across devices
- ✅ Automatic backups
- ✅ Better for production
- ❌ Requires backend server
- ❌ Slightly slower (~50-100ms)

---

## Quick Switch (2 minutes)

### Step 1: Update Import

**In `src/contexts/AppContext.tsx`:**

Change:
```typescript
import { promptStorage, artworkStorage, adminStorage } from '@/services/storage';
```

To:
```typescript
import { promptStorage, artworkStorage, adminStorage } from '@/services/storage-api';
```

### Step 2: Set Backend URL

Create `.env` file:
```env
VITE_API_URL=https://your-backend.railway.app
```

### Step 3: Rebuild

```bash
npm run build
```

**Done!** Your app now uses PostgreSQL instead of IndexedDB.

---

## Full Migration (Preserve Data)

If you want to keep your existing IndexedDB data:

### Step 1: Export IndexedDB Data

Open browser console and run:
```javascript
import('/src/services/database.ts').then(async (m) => {
  const data = await m.exportAllData();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'indexeddb-export.json';
  a.click();

  console.log('Exported:', data);
});
```

Save the downloaded JSON file.

### Step 2: Switch to PostgreSQL

Follow "Quick Switch" steps above.

### Step 3: Import Data to PostgreSQL

Create `server/import-indexeddb.ts`:

```typescript
import { db } from './src/db';
import { prompts, artworks } from './src/schema';
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('../indexeddb-export.json', 'utf-8'));

async function importData() {
  console.log('[Import] Starting...');

  // Import prompts
  for (const prompt of data.prompts) {
    await db.insert(prompts).values({
      id: prompt.id,
      prompt: prompt.prompt,
      email: prompt.email,
      status: prompt.status,
      promptNumber: prompt.promptNumber,
      createdAt: new Date(prompt.createdAt),
      completedAt: prompt.completedAt ? new Date(prompt.completedAt) : null,
      artworkId: prompt.artworkId,
    }).onConflictDoNothing();
  }

  console.log(`[Import] Imported ${data.prompts.length} prompts`);

  // Import artworks
  for (const artwork of data.artworks) {
    await db.insert(artworks).values({
      id: artwork.id,
      promptId: artwork.promptId,
      promptNumber: artwork.promptNumber,
      imageData: artwork.imageData,
      artistName: artwork.artistName,
      artistEmail: artwork.artistEmail,
      status: artwork.status,
      isAdminCreated: artwork.isAdminCreated,
      createdAt: new Date(artwork.createdAt),
      approvedAt: artwork.approvedAt ? new Date(artwork.approvedAt) : null,
    }).onConflictDoNothing();
  }

  console.log(`[Import] Imported ${data.artworks.length} artworks`);
  console.log('[Import] Complete!');
}

importData();
```

Run:
```bash
cd server
tsx import-indexeddb.ts
```

---

## Testing Both Versions

You can keep both and switch between them:

### File Structure

```
src/services/
├── database.ts         # IndexedDB (Dexie)
├── storage.ts          # Uses IndexedDB
├── storage-api.ts      # Uses PostgreSQL API
└── api.ts              # API client
```

### Switch by Changing Import

**For IndexedDB:**
```typescript
import { storage } from '@/services/storage';
```

**For PostgreSQL:**
```typescript
import { storage } from '@/services/storage-api';
```

### Or Use Environment Variable

Create `src/services/storage-auto.ts`:

```typescript
const USE_API = import.meta.env.VITE_USE_API === 'true';

export const storage = USE_API
  ? await import('./storage-api')
  : await import('./storage');

export const { promptStorage, artworkStorage, adminStorage } = storage;
```

Then in `.env`:
```env
# Use PostgreSQL
VITE_USE_API=true

# Or use IndexedDB
VITE_USE_API=false
```

---

## Rollback to IndexedDB

If you need to go back:

### Step 1: Revert Import

Change:
```typescript
import { storage } from '@/services/storage-api';
```

Back to:
```typescript
import { storage } from '@/services/storage';
```

### Step 2: Rebuild

```bash
npm run build
```

Your IndexedDB data is still there!

---

## Performance Comparison

| Operation | IndexedDB | PostgreSQL/API |
|-----------|-----------|----------------|
| Initial Load | 50ms | 200ms |
| Create Prompt | 5ms | 100ms |
| Create Artwork | 10ms | 150ms |
| Get Gallery | 15ms | 100ms |

**Note:** Times include network latency for API version.

---

## Feature Comparison

| Feature | IndexedDB | PostgreSQL |
|---------|-----------|------------|
| Data Sharing | ❌ Local only | ✅ Shared |
| Offline Support | ✅ Yes | ❌ Needs internet |
| Backup | Manual only | ✅ Automatic |
| Multi-device | ❌ No | ✅ Yes |
| Setup Required | ❌ None | ⚠️ Backend needed |
| Cost | FREE | ~$10/month |

---

## Recommendations

**Use IndexedDB if:**
- Personal project
- Single user
- Offline-first important
- No budget

**Use PostgreSQL if:**
- Multiple users
- Need data sharing
- Production app
- Want backups
- Multi-device access

**Use Both?**
- Local draft mode (IndexedDB)
- Sync to cloud (PostgreSQL)
- Best of both worlds!

---

## Hybrid Approach

You can use both! Save drafts locally, sync to PostgreSQL when ready:

```typescript
// Save draft locally
await indexedDBStorage.create(prompt, email);

// When ready, sync to server
await postgresStorage.create(prompt, email);
```

This gives you:
- ✅ Fast local drafts
- ✅ Cloud backup
- ✅ Data sharing
- ✅ Offline support

---

## Troubleshooting

### "API not reachable"
- Check `VITE_API_URL` is set correctly
- Verify backend is running: `curl https://your-backend/health`
- Check browser console for CORS errors

### "Data not appearing"
- Verify import completed successfully
- Check database: `railway run psql $DATABASE_URL -c "SELECT * FROM prompts;"`
- Clear browser cache

### "Slow performance"
- API is slower than IndexedDB (expected)
- Consider hybrid approach
- Add caching layer if needed

---

## Next Steps

1. [ ] Export IndexedDB data (if needed)
2. [ ] Switch to PostgreSQL storage
3. [ ] Import data to backend
4. [ ] Test functionality
5. [ ] Deploy to production

See [QUICK_START.md](QUICK_START.md) for deployment guide.
