# Importing Data from Supabase to Local Database

This guide explains how to import your existing data from Supabase into the new local IndexedDB database.

## Quick Start

### Option 1: Using the Browser Console (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser's developer console** (F12 or right-click > Inspect > Console)

3. **Run the import command:**
   ```javascript
   // Replace these with your actual Supabase credentials
   const supabaseUrl = 'https://hebruzjorytvlxquacxe.supabase.co';
   const supabaseKey = 'your-anon-key-here';

   // Import the function
   import('/src/utils/importFromSupabase.ts').then(module => {
     module.importFromSupabase(supabaseUrl, supabaseKey)
       .then(result => console.log('Import successful!', result))
       .catch(error => console.error('Import failed:', error));
   });
   ```

4. **Check the results** - You should see a message indicating how many prompts and artworks were imported.

### Option 2: Using a Node.js Script

Create a file called `import-data.js` in the root directory:

```javascript
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://hebruzjorytvlxquacxe.supabase.co';
const supabaseKey = 'your-anon-key-here';

async function exportData() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/kv_store_b9ff1a07?select=*`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    }
  );

  const data = await response.json();

  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('./supabase-export.json', JSON.stringify(data, null, 2));
  console.log('Data exported to supabase-export.json');
}

exportData();
```

Then run:
```bash
node import-data.js
```

This will create a `supabase-export.json` file that you can review before importing.

## What Gets Imported?

The import script will:
- ✅ Import all prompts with their status, email, and timestamps
- ✅ Import all artworks (approved and pending)
- ✅ Preserve prompt numbers and relationships
- ✅ Maintain artist information
- ✅ Keep timestamps and metadata

## Database Comparison

### Before (Supabase)
- ⚠️ Remote database (requires internet)
- ⚠️ API calls for every operation
- ⚠️ Subject to rate limits
- ⚠️ Monthly costs

### After (IndexedDB)
- ✅ **Local-first** (works offline)
- ✅ **Faster** (no network latency)
- ✅ **No limits** (no API rate limits)
- ✅ **Free** (no hosting costs)
- ✅ **Privacy** (data stays on device)

## Verifying the Import

After importing, you can check your data:

1. **View database stats:**
   ```javascript
   import('/src/services/database.ts').then(module => {
     module.getDatabaseStats().then(stats => console.log(stats));
   });
   ```

2. **Export all data to verify:**
   ```javascript
   import('/src/services/database.ts').then(module => {
     module.exportAllData().then(data => console.log(data));
   });
   ```

## Troubleshooting

### Error: "Failed to fetch data"
- Check that your Supabase URL and key are correct
- Make sure your Supabase project is still active
- Check browser console for CORS errors

### Error: "Import failed"
- Clear the database and try again:
  ```javascript
  import('/src/services/database.ts').then(module => {
    module.clearDatabase().then(() => console.log('Database cleared'));
  });
  ```

### Data looks incomplete
- Check the `supabase-export.json` file to verify source data
- Make sure you're using the correct table name (`kv_store_b9ff1a07`)

## Next Steps

After importing:
1. Test the app to ensure everything works
2. Verify all prompts and artworks are visible
3. Once confirmed, you can phase out Supabase usage
4. Consider backing up your local data periodically

## Backing Up Local Data

To backup your IndexedDB data:

```javascript
import('/src/services/storage.ts').then(module => {
  module.exportAllData().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-tool-backup-${Date.now()}.json`;
    a.click();
  });
});
```
