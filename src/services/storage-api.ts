/**
 * Storage layer using PostgreSQL API backend
 * Use this instead of storage.ts when you want cloud-based storage with email functionality
 */

import type { Prompt, Artwork } from '@/types';
import { promptAPI, artworkAPI } from './api';
import { generateId } from '@/utils/format';

/**
 * Prompt storage operations (API-based)
 */
export const promptStorage = {
  async getAll(): Promise<Prompt[]> {
    return promptAPI.getAll();
  },

  async getById(id: string): Promise<Prompt | undefined> {
    try {
      return await promptAPI.getById(id);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return undefined;
    }
  },

  async create(prompt: string, email: string): Promise<Prompt> {
    const id = generateId();
    return promptAPI.create({ id, prompt, email });
  },

  async update(id: string, updates: Partial<Prompt>): Promise<void> {
    await promptAPI.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await promptAPI.delete(id);
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
    const allPrompts = await this.getAll();
    await Promise.all(allPrompts.map(p => this.delete(p.id)));
  },
};

/**
 * Artwork storage operations (API-based)
 */
export const artworkStorage = {
  async getAll(): Promise<Artwork[]> {
    return artworkAPI.getAll();
  },

  async getApproved(): Promise<Artwork[]> {
    return artworkAPI.getApproved();
  },

  async getPending(): Promise<Artwork[]> {
    return artworkAPI.getPending();
  },

  async getById(id: string): Promise<Artwork | undefined> {
    try {
      const allArtworks = await this.getAll();
      return allArtworks.find(a => a.id === id);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      return undefined;
    }
  },

  async getNextPromptNumber(): Promise<number> {
    return artworkAPI.getNextPromptNumber();
  },

  async create(data: {
    imageData: string;
    promptId?: string;
    promptText?: string;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }): Promise<Artwork> {
    const id = generateId();
    const promptNumber = await this.getNextPromptNumber();

    return artworkAPI.create({
      id,
      promptNumber,
      ...data,
    });
  },

  async update(_id: string, _updates: Partial<Artwork>): Promise<void> {
    // Note: The backend doesn't have a generic update endpoint
    // You may need to add this to the backend if needed
    console.warn('Artwork update not implemented in API backend');
  },

  async approve(id: string): Promise<void> {
    await artworkAPI.approve(id);
  },

  async reject(id: string): Promise<void> {
    await this.delete(id);
  },

  async delete(id: string): Promise<void> {
    await artworkAPI.delete(id);
  },

  async clear(): Promise<void> {
    const allArtworks = await this.getAll();
    await Promise.all(allArtworks.map(a => this.delete(a.id)));
  },
};

/**
 * Admin storage operations (localStorage-based, same as storage.ts)
 */
export const adminStorage = {
  login(): void {
    localStorage.setItem('drawing-tool-admin', 'true');
  },

  logout(): void {
    localStorage.removeItem('drawing-tool-admin');
  },

  isLoggedIn(): boolean {
    return localStorage.getItem('drawing-tool-admin') === 'true';
  },
};
