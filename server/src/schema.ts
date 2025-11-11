/**
 * Database Schema for Drawing Tool
 * PostgreSQL schema using Drizzle ORM
 */

import { pgTable, text, integer, timestamp, boolean, serial, jsonb } from 'drizzle-orm/pg-core';

/**
 * Prompts table - User submitted prompts
 */
export const prompts = pgTable('prompts', {
  id: text('id').primaryKey(),
  prompt: text('prompt').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'in_progress'
  promptNumber: integer('prompt_number'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  artworkId: text('artwork_id'),
});

/**
 * Artworks table - Submitted artworks with images
 */
export const artworks = pgTable('artworks', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id').references(() => prompts.id, { onDelete: 'set null' }),
  promptNumber: integer('prompt_number').notNull(),
  imageData: text('image_data').notNull(), // base64 encoded image or URL
  artistName: text('artist_name'),
  artistEmail: text('artist_email'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  isAdminCreated: boolean('is_admin_created').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
});

/**
 * Site content table - Configuration and content
 */
export const siteContent = pgTable('site_content', {
  id: text('id').primaryKey().default('default'),
  projectTitle: text('project_title').notNull(),
  projectDescription: text('project_description').notNull(),
  bookLink: text('book_link'),
  bookTitle: text('book_title'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Type exports for TypeScript
 */
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;

export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;
