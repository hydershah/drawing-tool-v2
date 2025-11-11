# PostgreSQL + Railway Deployment Guide

Complete guide to deploy Drawing Tool V2 with PostgreSQL backend on Railway.

## Overview

This setup uses:
- **Frontend**: React + Vite (static site)
- **Backend**: Express + TypeScript API
- **Database**: PostgreSQL on Railway
- **Storage**: Base64 images stored directly in PostgreSQL

## Architecture

```
User Browser (Frontend)
       ↓
  API Calls
       ↓
Express Server (Railway)
       ↓
PostgreSQL Database (Railway)
```

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Node.js 18+ installed locally
- Git installed

---

## Part 1: Local Development Setup

### 1. Install Backend Dependencies

```bash
cd "/Users/hyder/drawing tool/drawing-tool-v2/server"
npm install
```

### 2. Set Up Local PostgreSQL (Optional)

If you want to test locally before deploying:

**Option A: Use Docker**
```bash
docker run --name drawing-tool-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=drawing_tool \
  -p 5432:5432 \
  -d postgres:16
```

**Option B: Install PostgreSQL directly**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb drawing_tool
```

### 3. Configure Environment

```bash
# In server directory
cp .env.example .env

# Edit .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/drawing_tool
PORT=3001
NODE_ENV=development
```

### 4. Initialize Database

```bash
# Run the SQL migration
psql -d drawing_tool -f init.sql

# Or if using Docker:
cat init.sql | docker exec -i drawing-tool-postgres psql -U postgres -d drawing_tool
```

### 5. Start Backend Server

```bash
npm run dev
```

Server should start on `http://localhost:3001`

### 6. Start Frontend

```bash
cd ..  # Back to root
npm run dev
```

Frontend should start on `http://localhost:5173`

---

## Part 2: Railway Deployment

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy PostgreSQL"
4. Wait for database to provision

### Step 2: Get Database Connection String

1. Click on your PostgreSQL service
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` value
4. It looks like: `postgresql://postgres:...@...railway.app:5432/railway`

### Step 3: Initialize Database Schema

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run psql $DATABASE_URL -f server/init.sql
```

**Option B: Using PostgreSQL Client**
```bash
# Copy your DATABASE_URL from Railway
psql "postgresql://postgres:...@...railway.app:5432/railway" -f server/init.sql
```

**Option C: Using Railway Dashboard**
1. Go to your PostgreSQL service in Railway
2. Click "Query"
3. Copy and paste contents of `server/init.sql`
4. Click "Execute"

### Step 4: Deploy Backend API

**Method 1: Using Railway CLI (Recommended)**

```bash
cd server

# Initialize Railway project
railway init

# Set environment variables
railway variables set NODE_ENV=production

# Deploy
railway up

# Get the deployment URL
railway open
```

**Method 2: Using GitHub**

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/drawing-tool-v2.git
git push -u origin main
```

2. In Railway:
- Click "New Service"
- Select "GitHub Repo"
- Choose your repository
- Select `/server` as the root directory

3. Configure build settings in Railway:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/server`

4. Add environment variable:
- `NODE_ENV`: `production`
- `DATABASE_URL`: (should be automatically connected)

### Step 5: Configure Database Connection

Railway should automatically connect `DATABASE_URL`, but verify:

1. Go to your backend service
2. Click "Variables"
3. Ensure `DATABASE_URL` is connected to your PostgreSQL service
4. If not, manually add it with the connection string

### Step 6: Deploy Frontend

**Option A: Deploy to Vercel**

```bash
# In project root
npm i -g vercel

# Create .env.production
echo "VITE_API_URL=https://your-backend.railway.app" > .env.production

# Deploy
vercel --prod
```

**Option B: Deploy to Netlify**

```bash
npm i -g netlify-cli

# Build with environment variable
VITE_API_URL=https://your-backend.railway.app npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**Option C: Deploy Frontend to Railway**

1. Create new service in Railway
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npx serve -s dist -l $PORT`
5. Add environment variable:
   - `VITE_API_URL`: `https://your-backend.railway.app`

---

## Part 3: Import Existing Data from Supabase

If you have existing data in Supabase, import it:

### 1. Export from Supabase

```javascript
// Run in browser console on your old app
const response = await fetch(
  'https://hebruzjorytvlxquacxe.supabase.co/rest/v1/kv_store_b9ff1a07?select=*',
  {
    headers: {
      'apikey': 'YOUR_SUPABASE_KEY',
      'Authorization': 'Bearer YOUR_SUPABASE_KEY'
    }
  }
);
const data = await response.json();

// Download as JSON
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'supabase-export.json';
a.click();
```

### 2. Transform and Import

Create a migration script `import-from-supabase.ts`:

```typescript
import { db } from './src/db';
import { prompts, artworks } from './src/schema';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./supabase-export.json', 'utf-8'));

async function importData() {
  for (const item of data) {
    const { key, value } = item;

    // Import prompts
    if (key.startsWith('prompt_')) {
      await db.insert(prompts).values({
        id: value.id,
        prompt: value.prompt,
        email: value.email,
        status: value.status || 'pending',
        createdAt: new Date(value.timestamp),
      });
    }

    // Import artworks
    if (key.startsWith('artwork_') || key.startsWith('gallery_')) {
      await db.insert(artworks).values({
        id: value.id,
        imageData: value.imageData || value.imageUrl,
        promptNumber: value.promptNumber || 0,
        artistName: value.artistName,
        status: value.status || 'approved',
        isAdminCreated: value.type === 'admin_artwork',
        createdAt: new Date(value.timestamp),
      });
    }
  }

  console.log('Import complete!');
}

importData();
```

Run:
```bash
tsx import-from-supabase.ts
```

---

## Part 4: Verification & Testing

### 1. Test API Endpoints

```bash
# Health check
curl https://your-backend.railway.app/health

# Get prompts
curl https://your-backend.railway.app/api/prompts

# Get artworks
curl https://your-backend.railway.app/api/artworks/approved
```

### 2. Test Frontend

1. Open your deployed frontend URL
2. Submit a test prompt
3. Check if it appears in the database:

```bash
railway run psql $DATABASE_URL -c "SELECT * FROM prompts;"
```

### 3. Check Logs

```bash
# Backend logs
railway logs

# Or in dashboard
# Go to your service > Logs tab
```

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://...  # Provided by Railway
PORT=3001                       # Railway will override with $PORT
NODE_ENV=production
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend.railway.app
```

---

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Check `DATABASE_URL` is correctly set
- Verify PostgreSQL service is running in Railway
- Check if IP is whitelisted (Railway usually allows all)

**Error: "relation does not exist"**
- Run the `init.sql` migration
- Check if tables were created: `\dt` in psql

### API Issues

**Error: "CORS policy"**
- Frontend URL needs to be added to CORS whitelist in `src/index.ts`
- Update CORS configuration:
```typescript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173']
}));
```

**Error: "413 Payload Too Large"**
- Images too big - already configured for 50MB
- Check Express body parser limits

### Deployment Issues

**Build fails on Railway**
```bash
# Check build logs
railway logs --deployment

# Common fixes:
# 1. Ensure package.json is correct
# 2. TypeScript errors - run `npm run build` locally
# 3. Missing dependencies - check package.json
```

---

## Database Management

### View all data

```bash
railway run psql $DATABASE_URL

# In psql:
\dt                          # List tables
SELECT * FROM prompts;       # View prompts
SELECT * FROM artworks;      # View artworks
SELECT * FROM site_content;  # View site config
```

### Backup database

```bash
# Export to SQL
railway run pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### Clear all data

```sql
TRUNCATE TABLE artworks, prompts, site_content CASCADE;
```

---

## Cost Estimate

### Railway Pricing (as of 2025)
- **PostgreSQL**: ~$5/month (512MB RAM, 1GB storage)
- **Backend API**: ~$5/month (512MB RAM)
- **Total**: ~$10/month

### Free Tier
- Railway offers $5/month free credit
- Perfect for testing and small projects

### Scaling
- Increase database size as artworks grow
- Base64 images in DB: ~1.4x original size
- 1000 images @ 100KB each = ~140MB

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Initialize PostgreSQL database
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Import existing Supabase data
5. ✅ Test full application
6. 🔄 Set up monitoring (Railway provides built-in metrics)
7. 🔄 Set up backups (automate pg_dump)
8. 🔄 Add custom domain (if desired)

---

## Support

For issues:
1. Check Railway logs: `railway logs`
2. Check database: `railway run psql $DATABASE_URL`
3. Test API endpoints with curl
4. Review frontend console for errors

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
