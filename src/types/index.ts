/**
 * Core type definitions for the drawing tool application
 */

export interface Prompt {
  id: string;
  prompt: string;
  email: string;
  status: 'pending' | 'completed' | 'in_progress';
  createdAt: number;
  completedAt?: number;
  artworkId?: string;
  promptNumber?: number;
}

export interface Artwork {
  id: string;
  promptId?: string;
  promptNumber: number;
  imageData: string; // base64 encoded image
  artistName?: string;
  artistEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  approvedAt?: number;
  isAdminCreated: boolean;
}

export interface SiteContent {
  projectTitle: string;
  projectDescription: string;
  bookLink?: string;
  bookTitle?: string;
}

export interface BrushSettings {
  size: number; // 5-80
  density: number; // 10-100
  contrast: number; // 0-100
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export type Theme = 'light' | 'dark' | 'system';

export type AdminRole = 'admin' | null;

export interface StorageData<T> {
  data: T[];
  lastModified: number;
}
