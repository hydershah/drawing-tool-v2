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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// PROMPTS ENDPOINTS
// ============================================

// Get all prompts
app.get('/api/prompts', async (req, res) => {
  try {
    const allPrompts = await db.select()
      .from(schema.prompts)
      .orderBy(desc(schema.prompts.promptNumber), desc(schema.prompts.createdAt));

    res.json(allPrompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get prompt by ID
app.get('/api/prompts/:id', async (req, res) => {
  try {
    const prompt = await db.select()
      .from(schema.prompts)
      .where(eq(schema.prompts.id, req.params.id))
      .limit(1);

    if (prompt.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(prompt[0]);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// Create new prompt
app.post('/api/prompts', async (req, res) => {
  try {
    const { id, prompt, email } = req.body;

    if (!id || !prompt || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPrompt = await db.insert(schema.prompts)
      .values({
        id,
        prompt,
        email,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();

    // Send confirmation email to prompt submitter (don't block response)
    if (email && emailService.validateEmail(email)) {
      emailService.sendPromptSubmissionEmail(
        email,
        prompt
      ).catch(err => {
        console.error('[Prompt Creation] Failed to send submission confirmation email:', err);
      });
    }

    res.status(201).json(newPrompt[0]);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Update prompt
app.patch('/api/prompts/:id', async (req, res) => {
  try {
    const updated = await db.update(schema.prompts)
      .set(req.body)
      .where(eq(schema.prompts.id, req.params.id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Mark prompt as completed
app.patch('/api/prompts/:id/complete', async (req, res) => {
  try {
    const updated = await db.update(schema.prompts)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(schema.prompts.id, req.params.id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    console.log(`[Complete Prompt] Marked prompt ${req.params.id} as completed`);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error completing prompt:', error);
    res.status(500).json({ error: 'Failed to complete prompt' });
  }
});

// Delete prompt
app.delete('/api/prompts/:id', async (req, res) => {
  try {
    await db.delete(schema.prompts)
      .where(eq(schema.prompts.id, req.params.id));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// ============================================
// ARTWORKS ENDPOINTS
// ============================================

// Get all artworks
app.get('/api/artworks', async (req, res) => {
  try {
    const status = req.query.status as string;

    const artworks = status
      ? await db.select()
          .from(schema.artworks)
          .where(eq(schema.artworks.status, status))
          .orderBy(desc(schema.artworks.promptNumber), desc(schema.artworks.createdAt))
      : await db.select()
          .from(schema.artworks)
          .orderBy(desc(schema.artworks.promptNumber), desc(schema.artworks.createdAt));

    res.json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get approved artworks (public gallery)
app.get('/api/artworks/approved', async (req, res) => {
  try {
    const artworks = await db.select()
      .from(schema.artworks)
      .where(eq(schema.artworks.status, 'approved'))
      .orderBy(desc(schema.artworks.promptNumber), desc(schema.artworks.createdAt));

    res.json(artworks);
  } catch (error) {
    console.error('Error fetching approved artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get next prompt number
app.get('/api/artworks/next-number', async (req, res) => {
  try {
    const result = await db.select({ maxNumber: schema.artworks.promptNumber })
      .from(schema.artworks)
      .orderBy(desc(schema.artworks.promptNumber))
      .limit(1);

    const nextNumber = result.length > 0 && result[0].maxNumber
      ? result[0].maxNumber + 1
      : 1;

    res.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next prompt number:', error);
    res.status(500).json({ error: 'Failed to get next number' });
  }
});

// Create artwork
app.post('/api/artworks', async (req, res) => {
  try {
    const { id, imageData, promptId, promptText, artistName, artistEmail, isAdminCreated, promptNumber } = req.body;

    if (!id || !imageData || !promptNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newArtwork = await db.insert(schema.artworks)
      .values({
        id,
        imageData,
        promptId,
        promptNumber,
        artistName,
        artistEmail,
        isAdminCreated: isAdminCreated || false,
        status: isAdminCreated ? 'approved' : 'pending',
        createdAt: new Date(),
      })
      .returning();

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

      // Email 2: Find matching prompt and notify submitter
      if (promptText) {
        // Find prompt by exact text match (case-insensitive)
        db.select()
          .from(schema.prompts)
          .where(sql`LOWER(TRIM(${schema.prompts.prompt})) = LOWER(TRIM(${promptText}))`)
          .limit(1)
          .then(matchingPrompts => {
            if (matchingPrompts.length > 0) {
              const matchingPrompt = matchingPrompts[0];
              if (matchingPrompt.email && emailService.validateEmail(matchingPrompt.email)) {
                emailService.sendPromptUsedEmail(
                  matchingPrompt.email,
                  matchingPrompt.prompt,
                  artistName || 'An artist'
                ).catch(err => {
                  console.error('[Artwork Creation] Failed to send prompt submitter email:', err);
                });
              }
            }
          })
          .catch(err => {
            console.error('[Artwork Creation] Failed to find matching prompt:', err);
          });
      }
    }

    res.status(201).json(newArtwork[0]);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

// Approve artwork
app.patch('/api/artworks/:id/approve', async (req, res) => {
  try {
    const updated = await db.update(schema.artworks)
      .set({
        status: 'approved',
        approvedAt: new Date(),
      })
      .where(eq(schema.artworks.id, req.params.id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const artwork = updated[0];

    // Mark prompt as completed if this artwork is linked to a prompt
    if (artwork.promptId) {
      try {
        await db.update(schema.prompts)
          .set({
            status: 'completed',
            completedAt: new Date(),
            artworkId: artwork.id,
          })
          .where(eq(schema.prompts.id, artwork.promptId));

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

// Delete artwork
app.delete('/api/artworks/:id', async (req, res) => {
  try {
    await db.delete(schema.artworks)
      .where(eq(schema.artworks.id, req.params.id));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// ============================================
// SITE CONTENT ENDPOINTS
// ============================================

// Get site content
app.get('/api/site-content', async (req, res) => {
  try {
    const content = await db.select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.id, 'default'))
      .limit(1);

    if (content.length === 0) {
      // Return default content
      return res.json({
        id: 'default',
        projectTitle: 'Drawing Tool',
        projectDescription: 'Submit prompts and receive custom artwork',
      });
    }

    res.json(content[0]);
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// Update site content
app.put('/api/site-content', async (req, res) => {
  try {
    const { projectTitle, projectDescription, bookLink, bookTitle } = req.body;

    const updated = await db.insert(schema.siteContent)
      .values({
        id: 'default',
        projectTitle,
        projectDescription,
        bookLink,
        bookTitle,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.siteContent.id,
        set: {
          projectTitle,
          projectDescription,
          bookLink,
          bookTitle,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(updated[0]);
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

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Serving frontend from: ${frontendDistPath}`);
});
