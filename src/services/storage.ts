/**
 * Database storage service for persisting application data
 * Uses IndexedDB with Dexie for fast, local browser storage
 */

import type { Prompt, Artwork, SiteContent } from '@/types';
import { db } from './database';
import { generateId } from '@/utils/format';

/**
 * Prompt storage operations
 */
export const promptStorage = {
  async getAll(): Promise<Prompt[]> {
    try {
      return await db.prompts.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Prompt | undefined> {
    try {
      return await db.prompts.get(id);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return undefined;
    }
  },

  async create(prompt: string, email: string): Promise<Prompt> {
    const newPrompt: Prompt = {
      id: generateId(),
      prompt,
      email,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      await db.prompts.add(newPrompt);
      return newPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Prompt>): Promise<void> {
    try {
      await db.prompts.update(id, updates);
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.prompts.delete(id);
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  },

  async markAsCompleted(id: string, artworkId: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: Date.now(),
      artworkId,
    });
  },

  async markAsInProgress(id: string): Promise<void> {
    await this.update(id, { status: 'in_progress' });
  },

  async clear(): Promise<void> {
    try {
      await db.prompts.clear();
    } catch (error) {
      console.error('Error clearing prompts:', error);
      throw error;
    }
  },
};

/**
 * Artwork storage operations
 */
export const artworkStorage = {
  async getAll(): Promise<Artwork[]> {
    try {
      return await db.artworks.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error fetching artworks:', error);
      return [];
    }
  },

  async getApproved(): Promise<Artwork[]> {
    try {
      return await db.artworks
        .where('status')
        .equals('approved')
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      console.error('Error fetching approved artworks:', error);
      return [];
    }
  },

  async getPending(): Promise<Artwork[]> {
    try {
      return await db.artworks
        .where('status')
        .equals('pending')
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      console.error('Error fetching pending artworks:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Artwork | undefined> {
    try {
      return await db.artworks.get(id);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      return undefined;
    }
  },

  async getNextPromptNumber(): Promise<number> {
    try {
      const artworks = await db.artworks.toArray();
      if (artworks.length === 0) return 1;
      const promptNumbers = artworks
        .map(a => a.promptNumber)
        .filter((n): n is number => n != null);
      if (promptNumbers.length === 0) return 1;
      return Math.max(...promptNumbers) + 1;
    } catch (error) {
      console.error('Error getting next prompt number:', error);
      return 1;
    }
  },

  async create(data: {
    imageData: string;
    promptId?: string;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }): Promise<Artwork> {
    const newArtwork: Artwork = {
      id: generateId(),
      promptNumber: await this.getNextPromptNumber(),
      status: data.isAdminCreated ? 'approved' : 'pending',
      createdAt: Date.now(),
      ...data,
    };

    try {
      await db.artworks.add(newArtwork);
      return newArtwork;
    } catch (error) {
      console.error('Error creating artwork:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Artwork>): Promise<void> {
    try {
      await db.artworks.update(id, updates);
    } catch (error) {
      console.error('Error updating artwork:', error);
      throw error;
    }
  },

  async approve(id: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      approvedAt: Date.now(),
    });
  },

  async reject(id: string): Promise<void> {
    await this.delete(id);
  },

  async delete(id: string): Promise<void> {
    try {
      await db.artworks.delete(id);
    } catch (error) {
      console.error('Error deleting artwork:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await db.artworks.clear();
    } catch (error) {
      console.error('Error clearing artworks:', error);
      throw error;
    }
  },
};

/**
 * Site content storage operations
 */
export const siteContentStorage = {
  async get(): Promise<SiteContent> {
    try {
      const content = await db.siteContent.get('default');
      return content || {
        projectTitle: 'Drawing Tool',
        projectDescription: 'Submit prompts and receive custom artwork',
      };
    } catch (error) {
      console.error('Error reading site content:', error);
      return {
        projectTitle: 'Drawing Tool',
        projectDescription: 'Submit prompts and receive custom artwork',
      };
    }
  },

  async set(content: SiteContent): Promise<void> {
    try {
      await db.siteContent.put({
        id: 'default',
        ...content,
      });
    } catch (error) {
      console.error('Error saving site content:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await db.siteContent.delete('default');
    } catch (error) {
      console.error('Error clearing site content:', error);
      throw error;
    }
  },
};

/**
 * Admin session storage (keep in localStorage for simplicity)
 */
const ADMIN_KEY = 'drawing_tool_admin_session';

export const adminStorage = {
  isLoggedIn(): boolean {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  },

  login(): void {
    localStorage.setItem(ADMIN_KEY, 'true');
  },

  logout(): void {
    localStorage.removeItem(ADMIN_KEY);
  },
};

/**
 * Export all storage for use in development/debugging
 */
export async function exportAllData() {
  return {
    prompts: await promptStorage.getAll(),
    artworks: await artworkStorage.getAll(),
    siteContent: await siteContentStorage.get(),
  };
}

/**
 * Clear all application data
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    promptStorage.clear(),
    artworkStorage.clear(),
    siteContentStorage.clear(),
  ]);
  adminStorage.logout();
}
