# Email Service Setup Guide

This guide explains how to set up the email service for drawing-tool-v2.

## Overview

The email service sends 3 types of emails:
1. **Artwork Submission Confirmation** - Sent to artist with PNG attachment
2. **Prompt Used Notification** - Sent to prompt submitter when someone draws their prompt
3. **Artwork Approval** - Sent to artist when their work is approved

## Email Provider: Resend

We use [Resend](https://resend.com) for email delivery.

### Current Configuration
- **API Key:** `re_JjUFV1GW_27DNiX8wA3rtDBBiPLMS2YSp`
- **From Email:** `hello@prompt-brush.com`
- **Domain:** Must be verified in Resend dashboard

## Setup Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install the `resend` package (already added to package.json).

### 2. Configure Environment Variables

Create `server/.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=3001
NODE_ENV=development

# Email (Resend)
RESEND_API_KEY=re_JjUFV1GW_27DNiX8wA3rtDBBiPLMS2YSp
EMAIL_FROM=hello@prompt-brush.com
```

### 3. Verify Domain in Resend

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add `prompt-brush.com` domain
3. Add the DNS records provided by Resend to your DNS provider
4. Wait for verification (usually takes a few minutes)

### 4. Switch to API-Based Storage

The email service requires the PostgreSQL backend. Update `src/contexts/AppContext.tsx`:

**Change from:**
```typescript
import { promptStorage, artworkStorage, adminStorage } from '@/services/storage';
```

**To:**
```typescript
import { promptStorage, artworkStorage, adminStorage } from '@/services/storage-api';
```

### 5. Configure Frontend API URL

Create `.env` file in the root:

```env
# Local development
VITE_API_URL=http://localhost:3001

# Production (update with your Railway URL)
# VITE_API_URL=https://your-backend.railway.app
```

### 6. Start the Backend Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3001`

### 7. Start the Frontend

```bash
# In the root directory
npm run dev
```

Frontend will run on `http://localhost:5173`

## How It Works

### Email Flow

```
USER SUBMITS ARTWORK
     ↓
Frontend calls addArtwork()
     ↓
API: POST /api/artworks
     ↓
Backend creates artwork in database
     ↓
EMAIL 1: Artist confirmation (with PNG)
     ↓
Backend finds matching prompt by text
     ↓
EMAIL 2: Prompt submitter notification (if email exists)
     ↓
Response sent to frontend


ADMIN APPROVES ARTWORK
     ↓
Frontend calls approveArtwork()
     ↓
API: PATCH /api/artworks/:id/approve
     ↓
Backend updates artwork status
     ↓
Backend fetches prompt text
     ↓
EMAIL 3: Artist approval notification
     ↓
Response sent to frontend
```

### Email Templates

All email templates are in `server/src/email.ts`:

1. **`sendArtworkSubmissionEmail()`** - Lines 32-89
2. **`sendPromptUsedEmail()`** - Lines 95-142
3. **`sendArtworkApprovedEmail()`** - Lines 148-195

### Backend Integration

Email logic integrated in `server/src/index.ts`:

- **Artwork creation** - Lines 202-241 (sends Email 1 & 2)
- **Artwork approval** - Lines 267-293 (sends Email 3)

## Testing

### Test Email Configuration

Check if Resend API key is working:

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Test Full Flow

1. **Submit a prompt** (homepage):
   - Enter prompt text
   - Enter email address
   - Submit

2. **Draw the prompt** (prompts page):
   - Click "Draw this prompt"
   - Create artwork
   - Enter artist name
   - Enter artist email
   - Submit

3. **Check emails**:
   - Artist should receive confirmation with PNG attachment
   - Prompt submitter should receive notification

4. **Approve artwork** (admin):
   - Login as admin
   - Go to Approvals page
   - Approve the artwork

5. **Check final email**:
   - Artist should receive approval email

## Troubleshooting

### Email not sending

1. **Check server logs:**
   ```bash
   # Look for errors like:
   [Email Service] Artwork submission email error: ...
   ```

2. **Verify API key:**
   - Check `server/.env` has correct `RESEND_API_KEY`
   - Verify key is active in Resend dashboard

3. **Verify domain:**
   - Domain must be verified in Resend
   - Check DNS records are correct

4. **Check email validation:**
   - Email must be valid format
   - Resend may block certain domains in sandbox mode

### Prompt matching not working

The system matches prompts by **exact text** (case-insensitive):

```typescript
// Backend query
WHERE LOWER(TRIM(prompt)) = LOWER(TRIM(promptText))
```

Ensure the prompt text passed from frontend matches exactly.

### Images not attaching

- Max file size: 8MB (validated in middleware)
- Format must be: `data:image/png;base64,...`
- Base64 encoding is automatically handled

### Environment Variables

If emails aren't sending, check environment variables are loaded:

```typescript
// server/src/email.ts
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_JjUFV1GW_27DNiX8wA3rtDBBiPLMS2YSp';
```

If `process.env.RESEND_API_KEY` is undefined, it falls back to the hardcoded key.

## Production Deployment

### Railway Deployment

1. **Deploy backend:**
   ```bash
   cd server
   railway up
   ```

2. **Set environment variables in Railway:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `RESEND_API_KEY` - Your Resend API key
   - `EMAIL_FROM` - Your verified sender email
   - `PORT` - 3001

3. **Update frontend `.env`:**
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy frontend** to Vercel/Netlify

### Security Notes

1. **Remove hardcoded API key:**

   Update `server/src/email.ts`:
   ```typescript
   // Before
   const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_JjUFV1GW_27DNiX8wA3rtDBBiPLMS2YSp';

   // After
   const RESEND_API_KEY = process.env.RESEND_API_KEY;
   if (!RESEND_API_KEY) {
     throw new Error('RESEND_API_KEY environment variable is required');
   }
   ```

2. **Add rate limiting** (optional):
   - Install `express-rate-limit`
   - Limit email endpoints to prevent abuse

3. **Verify email domains** (production):
   - Move from Resend sandbox to production mode
   - Verify all sender domains

## API Reference

### Frontend API Client

Located in `src/services/api.ts`:

```typescript
// Create artwork with email
artworkAPI.create({
  id: 'artwork-123',
  imageData: 'data:image/png;base64,...',
  promptId: 'prompt-456',
  promptText: 'A magical forest',
  artistName: 'Jane Doe',
  artistEmail: 'jane@example.com',
  isAdminCreated: false,
  promptNumber: 5
});

// Approve artwork (triggers email)
artworkAPI.approve('artwork-123');
```

### Backend Email Service

Located in `server/src/email.ts`:

```typescript
// Send artwork submission email
await sendArtworkSubmissionEmail(
  'artist@example.com',
  'Jane Doe',
  'A magical forest',
  'data:image/png;base64,...'
);

// Send prompt used notification
await sendPromptUsedEmail(
  'prompter@example.com',
  'A magical forest',
  'Jane Doe'
);

// Send approval email
await sendArtworkApprovedEmail(
  'artist@example.com',
  'Jane Doe',
  'A magical forest'
);
```

## Email Content

### Email 1: Artwork Submission

- **To:** Artist email
- **Subject:** `Artwork Submitted: {prompt}`
- **Content:**
  - Thank you message
  - Prompt in styled box
  - Artwork PNG attachment
  - Note about pending approval

### Email 2: Prompt Used

- **To:** Prompt submitter email
- **Subject:** `Someone Drew Your Prompt: "{prompt}"`
- **Content:**
  - Notification message
  - Prompt in styled box
  - Artist name in styled box
  - Note about pending approval
  - No attachment

### Email 3: Artwork Approved

- **To:** Artist email
- **Subject:** `Your Artwork: {prompt}`
- **Content:**
  - Congratulations message
  - Prompt in styled box
  - Thank you message
  - No attachment (already sent in Email 1)

## Files Changed

### Backend
- `server/package.json` - Added `resend` dependency
- `server/src/email.ts` - Email service implementation
- `server/src/index.ts` - Integrated email into artwork routes
- `server/.env.example` - Environment variable template

### Frontend
- `src/services/api.ts` - API client
- `src/services/storage-api.ts` - API-based storage layer
- `src/contexts/AppContext.tsx` - Added `promptText` parameter
- `src/pages/UserDrawPage.tsx` - Pass `promptText` to addArtwork
- `.env.example` - Frontend environment variables

## Next Steps

1. ✅ Install dependencies: `cd server && npm install`
2. ✅ Create `server/.env` with Resend API key
3. ✅ Verify domain in Resend dashboard
4. ✅ Switch AppContext to use `storage-api` instead of `storage`
5. ✅ Create `.env` with `VITE_API_URL`
6. ✅ Start backend: `cd server && npm run dev`
7. ✅ Start frontend: `npm run dev`
8. ✅ Test full email flow

---

**Need help?** Check the troubleshooting section or review the old codebase implementation in `/Users/hyder/drawing tool/src/supabase/functions/server/routes.ts`.
