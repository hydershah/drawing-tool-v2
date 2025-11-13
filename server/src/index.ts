/**
 * Express API Server for Drawing Tool
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db, schema } from './db';
import { eq, desc, and, sql } from 'drizzle-orm';
import * as emailService from './email';
import { initRedis, getCacheStats, clearAllCache } from './redis';
import cache from './cache-service';
import { performanceMiddleware, getPerformanceStats, getCacheStats as getPerfCacheStats } from './performance-monitor';

dotenv.config();

// Initialize Redis
initRedis();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add performance monitoring middleware
app.use(performanceMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cache stats endpoint
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    const perfStats = getPerformanceStats();
    res.json({
      redis: stats,
      performance: perfStats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Clear cache endpoint (admin only - you should add authentication)
app.post('/api/cache/clear', async (req, res) => {
  try {
    await clearAllCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Warm cache endpoint
app.post('/api/cache/warm', async (req, res) => {
  try {
    await cache.warmer.warmAll();
    res.json({ message: 'Cache warmed successfully' });
  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({ error: 'Failed to warm cache' });
  }
});

// ============================================
// PROMPTS ENDPOINTS
// ============================================

// Get all prompts (with pagination) - USING REDIS CACHE
app.get('/api/prompts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const includeCount = req.query.includeCount === 'true';

    // Use cache service for prompts
    const allPrompts = await cache.prompts.getAll(limit, offset);

    // Optionally include total count for pagination UI
    if (includeCount) {
      const stats = await cache.prompts.getStats();
      const total = stats.total;

      res.json({
        data: allPrompts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + allPrompts.length < total
        }
      });
    } else {
      res.json(allPrompts);
    }
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get prompt by ID - USING REDIS CACHE
app.get('/api/prompts/:id', async (req, res) => {
  try {
    const prompt = await cache.prompts.getById(req.params.id);

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// Create new prompt - WITH CACHE INVALIDATION
app.post('/api/prompts', async (req, res) => {
  try {
    const { id, prompt, email } = req.body;

    if (!id || !prompt || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the next prompt number from cache
    const nextPromptNumber = await cache.prompts.getNextNumber();

    const newPrompt = await cache.prompts.create({
      id,
      prompt,
      email,
      status: 'pending',
      promptNumber: nextPromptNumber,
      createdAt: new Date(),
    });

    // Send confirmation email to prompt submitter (don't block response)
    if (email && emailService.validateEmail(email)) {
      emailService.sendPromptSubmissionEmail(
        email,
        prompt
      ).catch(err => {
        console.error('[Prompt Creation] Failed to send submission confirmation email:', err);
      });
    }

    res.status(201).json(newPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Update prompt - WITH CACHE INVALIDATION
app.patch('/api/prompts/:id', async (req, res) => {
  try {
    const updated = await cache.prompts.update(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Mark prompt as completed - WITH CACHE INVALIDATION
app.patch('/api/prompts/:id/complete', async (req, res) => {
  try {
    const { artworkId } = req.body;
    const updated = await cache.prompts.markCompleted(req.params.id, artworkId || null);

    if (!updated) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    console.log(`[Complete Prompt] Marked prompt ${req.params.id} as completed`);
    res.json(updated);
  } catch (error) {
    console.error('Error completing prompt:', error);
    res.status(500).json({ error: 'Failed to complete prompt' });
  }
});

// Delete prompt - WITH CACHE INVALIDATION
app.delete('/api/prompts/:id', async (req, res) => {
  try {
    await cache.prompts.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// ============================================
// ARTWORKS ENDPOINTS
// ============================================

// Get all artworks (with pagination) - USING REDIS CACHE
app.get('/api/artworks', async (req, res) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const includeCount = req.query.includeCount === 'true';

    let artworks;
    if (status === 'approved') {
      artworks = await cache.artworks.getApproved();
      // Apply pagination in memory for specific status
      artworks = artworks.slice(offset, offset + limit);
    } else if (status === 'pending') {
      artworks = await cache.artworks.getPending();
      // Apply pagination in memory for specific status
      artworks = artworks.slice(offset, offset + limit);
    } else {
      artworks = await cache.artworks.getAll(limit, offset);
    }

    // Optionally include total count for pagination UI
    if (includeCount) {
      const stats = await cache.artworks.getStats();
      const total = status === 'approved' ? stats.approved :
                   status === 'pending' ? stats.pending :
                   stats.total;

      res.json({
        data: artworks,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + artworks.length < total
        }
      });
    } else {
      res.json(artworks);
    }
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get approved artworks (public gallery with pagination) - USING REDIS CACHE
app.get('/api/artworks/approved', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const includeCount = req.query.includeCount === 'true';

    let artworks = await cache.artworks.getApproved();
    // Apply pagination in memory
    artworks = artworks.slice(offset, offset + limit);

    // Optionally include total count for pagination UI
    if (includeCount) {
      const stats = await cache.artworks.getStats();
      const total = stats.approved;

      res.json({
        data: artworks,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + artworks.length < total
        }
      });
    } else {
      res.json(artworks);
    }
  } catch (error) {
    console.error('Error fetching approved artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get next prompt number - USING REDIS CACHE
app.get('/api/artworks/next-number', async (req, res) => {
  try {
    const nextNumber = await cache.artworks.getNextNumber();
    res.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next prompt number:', error);
    res.status(500).json({ error: 'Failed to get next number' });
  }
});

// Create artwork - WITH CACHE INVALIDATION
app.post('/api/artworks', async (req, res) => {
  try {
    const { id, imageData, promptId, promptText, artistName, artistEmail, isAdminCreated, promptNumber } = req.body;

    if (!id || !imageData || !promptNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newArtwork = await cache.artworks.create({
      id,
      imageData,
      promptId,
      promptNumber,
      artistName,
      artistEmail,
      isAdminCreated: isAdminCreated || false,
      status: isAdminCreated ? 'approved' : 'pending',
      createdAt: new Date(),
    });

    // Send emails after artwork is created (don't block response)
    if (!isAdminCreated) {
      // Email 1: Send confirmation to artist (if email provided)
      if (artistEmail && emailService.validateEmail(artistEmail)) {
        emailService.sendArtworkSubmissionEmail(
          artistEmail,
          artistName || 'Artist',
          promptText || 'Your artwork',
          imageData
        ).catch(err => {
          console.error('[Artwork Creation] Failed to send artist email:', err);
        });
      }

      // Email 2: Notify prompt submitter that their prompt was used
      if (promptId) {
        // If promptId is provided, use it directly (more reliable)
        console.log(`[Artwork Creation] Finding prompt by ID: ${promptId}`);
        db.select()
          .from(schema.prompts)
          .where(eq(schema.prompts.id, promptId))
          .limit(1)
          .then(matchingPrompts => {
            if (matchingPrompts.length > 0) {
              const matchingPrompt = matchingPrompts[0];
              console.log(`[Artwork Creation] Found prompt by ID, email: ${matchingPrompt.email}`);
              if (matchingPrompt.email && emailService.validateEmail(matchingPrompt.email)) {
                emailService.sendPromptUsedEmail(
                  matchingPrompt.email,
                  matchingPrompt.prompt,
                  artistName || 'An artist'
                ).then(result => {
                  console.log('[Artwork Creation] Prompt used email sent:', result);
                }).catch(err => {
                  console.error('[Artwork Creation] Failed to send prompt submitter email:', err);
                });
              } else {
                console.log('[Artwork Creation] No valid email found for prompt submitter');
              }
            } else {
              console.log(`[Artwork Creation] No prompt found with ID: ${promptId}`);
            }
          })
          .catch(err => {
            console.error('[Artwork Creation] Failed to find prompt by ID:', err);
          });
      } else if (promptText) {
        // Fallback to text matching if no promptId
        console.log(`[Artwork Creation] Finding prompt by text match: ${promptText}`);
        db.select()
          .from(schema.prompts)
          .where(sql`LOWER(TRIM(${schema.prompts.prompt})) = LOWER(TRIM(${promptText}))`)
          .limit(1)
          .then(matchingPrompts => {
            if (matchingPrompts.length > 0) {
              const matchingPrompt = matchingPrompts[0];
              console.log(`[Artwork Creation] Found prompt by text match, email: ${matchingPrompt.email}`);
              if (matchingPrompt.email && emailService.validateEmail(matchingPrompt.email)) {
                emailService.sendPromptUsedEmail(
                  matchingPrompt.email,
                  matchingPrompt.prompt,
                  artistName || 'An artist'
                ).then(result => {
                  console.log('[Artwork Creation] Prompt used email sent:', result);
                }).catch(err => {
                  console.error('[Artwork Creation] Failed to send prompt submitter email:', err);
                });
              } else {
                console.log('[Artwork Creation] No valid email found for prompt submitter');
              }
            } else {
              console.log(`[Artwork Creation] No prompt found matching text: ${promptText}`);
            }
          })
          .catch(err => {
            console.error('[Artwork Creation] Failed to find matching prompt:', err);
          });
      } else {
        console.log('[Artwork Creation] No promptId or promptText provided, skipping prompt submitter email');
      }
    }

    res.status(201).json(newArtwork);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

// Approve artwork - WITH CACHE INVALIDATION
app.patch('/api/artworks/:id/approve', async (req, res) => {
  try {
    const artwork = await cache.artworks.approve(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Mark prompt as completed if this artwork is linked to a prompt
    if (artwork.promptId) {
      try {
        await cache.prompts.markCompleted(artwork.promptId, artwork.id);
        console.log(`[Approve Artwork] Marked prompt ${artwork.promptId} as completed`);
      } catch (err) {
        console.error(`[Approve Artwork] Error updating prompt status for ${artwork.promptId}:`, err);
      }
    }

    // Email 3: Send approval email to artist (don't block response)
    // Email 4: Send approval email to prompt submitter (don't block response)
    if (artwork.promptId) {
      try {
        const prompts = await db.select()
          .from(schema.prompts)
          .where(eq(schema.prompts.id, artwork.promptId))
          .limit(1);

        if (prompts.length > 0) {
          const prompt = prompts[0];
          const promptText = prompt.prompt;

          // Send approval email to artist
          if (artwork.artistEmail && emailService.validateEmail(artwork.artistEmail)) {
            emailService.sendArtworkApprovedEmail(
              artwork.artistEmail,
              artwork.artistName || 'Artist',
              promptText
            ).catch(err => {
              console.error('[Approve Artwork] Failed to send artist approval email:', err);
            });
          }

          // Send approval email to prompt submitter
          if (prompt.email && emailService.validateEmail(prompt.email)) {
            emailService.sendPromptArtworkApprovedEmail(
              prompt.email,
              promptText,
              artwork.artistName || 'An artist'
            ).catch(err => {
              console.error('[Approve Artwork] Failed to send prompt submitter approval email:', err);
            });
          }
        }
      } catch (err) {
        console.error('[Approve Artwork] Failed to fetch prompt for emails:', err);
      }
    } else if (artwork.artistEmail && emailService.validateEmail(artwork.artistEmail)) {
      // If no promptId, just send artist approval email with generic text
      emailService.sendArtworkApprovedEmail(
        artwork.artistEmail,
        artwork.artistName || 'Artist',
        'Your artwork'
      ).catch(err => {
        console.error('[Approve Artwork] Failed to send approval email:', err);
      });
    }

    res.json(artwork);
  } catch (error) {
    console.error('Error approving artwork:', error);
    res.status(500).json({ error: 'Failed to approve artwork' });
  }
});

// Delete artwork - WITH CACHE INVALIDATION
app.delete('/api/artworks/:id', async (req, res) => {
  try {
    await cache.artworks.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// ============================================
// SITE CONTENT ENDPOINTS
// ============================================

// Get site content - USING REDIS CACHE
app.get('/api/site-content', async (req, res) => {
  try {
    const content = await cache.siteContent.get();
    res.json(content);
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// Update site content - WITH CACHE INVALIDATION
app.put('/api/site-content', async (req, res) => {
  try {
    const { projectTitle, projectDescription, bookLink, bookTitle } = req.body;

    const updated = await cache.siteContent.update({
      projectTitle,
      projectDescription,
      bookLink,
      bookTitle,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating site content:', error);
    res.status(500).json({ error: 'Failed to update site content' });
  }
});

// ============================================
// EMAIL-ONLY ENDPOINTS (for Supabase frontend)
// ============================================

// Send prompt submission confirmation email
app.post('/api/emails/prompt-submission', async (req, res) => {
  try {
    const { email, prompt } = req.body;

    if (!email || !prompt) {
      return res.status(400).json({ error: 'Missing email or prompt' });
    }

    const result = await emailService.sendPromptSubmissionEmail(email, prompt);

    if (result.success) {
      res.json({ success: true, emailId: result.emailId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending prompt submission email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send artwork submission confirmation email
app.post('/api/emails/artwork-submission', async (req, res) => {
  try {
    const { artistEmail, artistName, prompt, imageData } = req.body;

    if (!artistEmail || !prompt || !imageData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await emailService.sendArtworkSubmissionEmail(
      artistEmail,
      artistName || 'Artist',
      prompt,
      imageData
    );

    if (result.success) {
      res.json({ success: true, emailId: result.emailId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending artwork submission email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send "prompt used" notification email
app.post('/api/emails/prompt-used', async (req, res) => {
  try {
    const { promptSubmitterEmail, prompt, artistName } = req.body;

    if (!promptSubmitterEmail || !prompt || !artistName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await emailService.sendPromptUsedEmail(
      promptSubmitterEmail,
      prompt,
      artistName
    );

    if (result.success) {
      res.json({ success: true, emailId: result.emailId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending prompt used email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send artwork approval emails (to both artist and prompt submitter)
app.post('/api/emails/artwork-approved', async (req, res) => {
  try {
    const { artistEmail, artistName, promptSubmitterEmail, prompt } = req.body;

    const results: {
      artist: { success: boolean; emailId?: string; error?: string } | null;
      promptSubmitter: { success: boolean; emailId?: string; error?: string } | null;
    } = { artist: null, promptSubmitter: null };

    // Send email to artist if provided
    if (artistEmail && emailService.validateEmail(artistEmail)) {
      results.artist = await emailService.sendArtworkApprovedEmail(
        artistEmail,
        artistName || 'Artist',
        prompt || 'Your artwork'
      );
    }

    // Send email to prompt submitter if provided
    if (promptSubmitterEmail && emailService.validateEmail(promptSubmitterEmail)) {
      results.promptSubmitter = await emailService.sendPromptArtworkApprovedEmail(
        promptSubmitterEmail,
        prompt || 'Your prompt',
        artistName || 'An artist'
      );
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error sending artwork approval emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// ============================================
// SERVE STATIC FILES (PRODUCTION)
// ============================================

// Serve static files from the frontend build directory
const frontendDistPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendDistPath));

// Handle React Router - send all non-API requests to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Serving frontend from: ${frontendDistPath}`);

  // Warm up Redis cache on startup
  console.log('[Server] Warming up Redis cache...');
  try {
    await cache.warmer.warmAll();
    console.log('[Server] Redis cache warmed successfully');
  } catch (error) {
    console.error('[Server] Failed to warm cache:', error);
  }
});
