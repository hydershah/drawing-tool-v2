# Quick Start - Drawing Tool V2 with PostgreSQL

Get your app running in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
cd "/Users/hyder/drawing tool/drawing-tool-v2"

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 2: Set Up Railway (3 min)

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy PostgreSQL"
3. Wait 30 seconds for provisioning
4. Click on PostgreSQL → "Variables" → Copy `DATABASE_URL`

## Step 3: Initialize Database (1 min)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Initialize database schema
railway run psql $DATABASE_URL -f server/init.sql
```

You should see: "Database schema created successfully!"

## Step 4: Configure Backend (1 min)

```bash
cd server

# Create environment file
cp .env.example .env

# Railway will auto-set DATABASE_URL when deployed
# For local testing, paste your DATABASE_URL:
# echo "DATABASE_URL=your-copied-url" >> .env
```

## Step 5: Deploy Backend to Railway (2 min)

```bash
# Still in server directory
railway up

# Wait for build... (~30 seconds)

# Get your backend URL
railway open
# Note this URL (e.g., https://your-app.railway.app)
```

## Step 6: Configure Frontend (1 min)

```bash
cd ..  # Back to root

# Create environment file
cp .env.example .env

# Edit .env and add your Railway backend URL
echo "VITE_API_URL=https://your-app.railway.app" > .env
```

## Step 7: Test Locally (Optional)

```bash
# Start frontend
npm run dev

# Visit http://localhost:5173
# Submit a test prompt
# Create test artwork
```

## Step 8: Deploy Frontend (1 min)

**Deploy to Vercel:**
```bash
npm i -g vercel
vercel --prod

# When prompted for VITE_API_URL, paste your Railway URL
```

**Or deploy to Netlify:**
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist

# Set environment variable in Netlify dashboard:
# VITE_API_URL = https://your-app.railway.app
```

---

## ✅ Done!

Your app is live! Visit your deployment URL.

### What's Running:

- **Frontend**: Vercel/Netlify (React app)
- **Backend**: Railway (Express API)
- **Database**: Railway (PostgreSQL)

### URLs to Save:

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`
- API Health: `https://your-app.railway.app/health`

---

## Test Your Deployment

```bash
# Test backend health
curl https://your-app.railway.app/health

# Test API
curl https://your-app.railway.app/api/prompts

# Test frontend
# Open your Vercel URL and submit a prompt
```

---

## Import Existing Supabase Data (Optional)

See [POSTGRESQL_RAILWAY_SETUP.md](POSTGRESQL_RAILWAY_SETUP.md#part-3-import-existing-data-from-supabase)

Quick version:
1. Export from Supabase (see guide)
2. Transform data
3. Import to PostgreSQL

---

## Common Issues

### Backend won't start
```bash
railway logs  # Check error messages
```

### Database connection failed
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

### Frontend can't reach backend
- Check `VITE_API_URL` in environment
- Verify backend is deployed: `curl https://your-backend/health`
- Check browser console for CORS errors

---

## Next Steps

- [ ] Import your Supabase data
- [ ] Set up custom domain
- [ ] Configure monitoring
- [ ] Set up automated backups

---

## Need Help?

1. **Full Guide**: [POSTGRESQL_RAILWAY_SETUP.md](POSTGRESQL_RAILWAY_SETUP.md)
2. **Backend Docs**: [server/README.md](server/README.md)
3. **Migration Summary**: [POSTGRESQL_MIGRATION_SUMMARY.md](POSTGRESQL_MIGRATION_SUMMARY.md)

---

## Cost

- Railway PostgreSQL: $5/month
- Railway Backend: $5/month
- Vercel/Netlify: FREE
- **Total: ~$10/month**

Railway offers $5 free credit to start!
