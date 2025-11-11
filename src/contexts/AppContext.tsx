/**
 * Application context for managing global state
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Prompt, Artwork } from '@/types';
import { promptStorage, artworkStorage, adminStorage } from '@/services/supabase-storage';

interface AppContextType {
  // Loading state
  isLoading: boolean;

  // Prompts
  prompts: Prompt[];
  addPrompt: (prompt: string, email: string) => Promise<Prompt>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  addEmailToPrompt: (id: string, email: string) => Promise<void>;
  completePrompt: (id: string) => Promise<void>;
  refreshPrompts: () => void;

  // Artworks
  artworks: Artwork[];
  pendingArtworks: Artwork[];
  addArtwork: (data: {
    imageData: string;
    promptId?: string;
    promptText?: string;
    promptNumber?: number;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }) => Promise<Artwork>;
  approveArtwork: (id: string) => void;
  rejectArtwork: (id: string) => void;
  deleteArtwork: (id: string) => void;
  refreshArtworks: () => void;

  // Admin
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[AppContext] Starting data load...');
        const startTime = Date.now();

        const [allPrompts, approvedArtworks, pendingArtworksData] = await Promise.all([
          promptStorage.getAll().then(data => {
            console.log('[AppContext] Prompts loaded:', data.length);
            return data;
          }),
          artworkStorage.getApproved().then(data => {
            console.log('[AppContext] Artworks loaded:', data.length);
            return data;
          }),
          artworkStorage.getPending().then(data => {
            console.log('[AppContext] Pending artworks loaded:', data.length);
            return data;
          }),
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`[AppContext] Data loaded in ${loadTime}ms`);

        // Enrich artworks with prompt numbers if missing
        const enrichedArtworks = approvedArtworks.map(artwork => {
          if (!artwork.promptNumber && artwork.promptId) {
            const prompt = allPrompts.find(p => p.id === artwork.promptId);
            if (prompt?.promptNumber) {
              return { ...artwork, promptNumber: prompt.promptNumber };
            }
          }
          return artwork;
        });

        setPrompts(allPrompts);
        setArtworks(enrichedArtworks);
        setPendingArtworks(pendingArtworksData);
        setIsAdmin(adminStorage.isLoggedIn());
      } catch (error) {
        console.error('[AppContext] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Prompt operations
  const addPrompt = useCallback(async (prompt: string, email: string) => {
    // Create optimistic prompt with temporary data
    const tempId = `temp-${Date.now()}`;
    const optimisticPrompt: Prompt = {
      id: tempId,
      prompt,
      email,
      status: 'pending',
      promptNumber: undefined,
      createdAt: Date.now(),
      completedAt: undefined,
      artworkId: undefined,
    };

    // Update UI immediately
    setPrompts(prev => [optimisticPrompt, ...prev]);

    try {
      // Create on backend
      const newPrompt = await promptStorage.create(prompt, email);

      // Replace optimistic prompt with real one
      setPrompts(prev => prev.map(p => p.id === tempId ? newPrompt : p));

      return newPrompt;
    } catch (error) {
      console.error('Failed to add prompt:', error);
      // Remove optimistic prompt on error
      setPrompts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  }, []);

  const updatePrompt = useCallback((id: string, updates: Partial<Prompt>) => {
    // Optimistic update - backend will sync on next refresh
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePrompt = useCallback(async (id: string) => {
    // Optimistic update - instant UI feedback
    const prompt = prompts.find(p => p.id === id);

    // Update UI immediately
    setPrompts(prev => prev.filter(p => p.id !== id));

    // Sync with backend in background
    try {
      await promptStorage.delete(id);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      // Revert on error
      if (prompt) {
        setPrompts(prev => [prompt, ...prev]);
      }
    }
  }, [prompts]);

  const addEmailToPrompt = useCallback(async (id: string, email: string) => {
    await promptStorage.addEmail(id, email);
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, email } : p));
  }, []);

  const completePrompt = useCallback(async (id: string) => {
    // Optimistic update - instant UI feedback
    const originalPrompt = prompts.find(p => p.id === id);

    // Update UI immediately
    setPrompts(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'completed' as const,
      completedAt: Date.now(),
    } : p));

    // Sync with backend in background
    try {
      await promptStorage.complete(id);
    } catch (error) {
      console.error('Failed to complete prompt:', error);
      // Revert on error
      if (originalPrompt) {
        setPrompts(prev => prev.map(p => p.id === id ? originalPrompt : p));
      }
      throw error;
    }
  }, [prompts]);

  const refreshPrompts = useCallback(async () => {
    const allPrompts = await promptStorage.getAll();
    setPrompts(allPrompts);
  }, []);

  // Artwork operations
  const addArtwork = useCallback(async (data: {
    imageData: string;
    promptId?: string;
    promptText?: string;
    promptNumber?: number;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }) => {
    // Create optimistic artwork
    const tempId = `temp-${Date.now()}`;

    // Calculate next prompt number from existing artworks
    let nextNumber = data.promptNumber;
    if (!nextNumber) {
      const allArtworkNumbers = [...artworks, ...pendingArtworks]
        .map(a => a.promptNumber)
        .filter((n): n is number => typeof n === 'number' && n > 0);
      nextNumber = allArtworkNumbers.length > 0 ? Math.max(...allArtworkNumbers) + 1 : 1;
    }

    const optimisticArtwork: Artwork = {
      id: tempId,
      promptId: data.promptId,
      promptNumber: nextNumber,
      imageData: data.imageData,
      artistName: data.artistName,
      artistEmail: data.artistEmail,
      status: data.isAdminCreated ? 'approved' : 'pending',
      isAdminCreated: data.isAdminCreated,
      createdAt: Date.now(),
      approvedAt: data.isAdminCreated ? Date.now() : undefined,
    };

    // Update UI immediately
    if (optimisticArtwork.status === 'approved') {
      setArtworks(prev => [optimisticArtwork, ...prev]);
    } else {
      setPendingArtworks(prev => [optimisticArtwork, ...prev]);
    }

    try {
      // Create on backend
      const newArtwork = await artworkStorage.create(data);

      // Replace optimistic artwork with real one
      if (newArtwork.status === 'approved') {
        setArtworks(prev => prev.map(a => a.id === tempId ? newArtwork : a));
      } else {
        setPendingArtworks(prev => prev.map(a => a.id === tempId ? newArtwork : a));
      }

      // Refresh prompts in background to get updated status
      if (data.promptId) {
        refreshPrompts();
      }

      return newArtwork;
    } catch (error) {
      console.error('Failed to add artwork:', error);
      // Remove optimistic artwork on error
      setArtworks(prev => prev.filter(a => a.id !== tempId));
      setPendingArtworks(prev => prev.filter(a => a.id !== tempId));
      throw error;
    }
  }, [artworks, pendingArtworks, refreshPrompts]);

  const approveArtwork = useCallback(async (id: string) => {
    // Optimistic update - instant UI feedback
    const pendingArtwork = pendingArtworks.find(a => a.id === id);
    if (!pendingArtwork) return;

    const approvedArtwork = {
      ...pendingArtwork,
      status: 'approved' as const,
      approvedAt: Date.now(),
    };

    // Update UI immediately
    setPendingArtworks(prev => prev.filter(a => a.id !== id));
    setArtworks(prev => [approvedArtwork, ...prev]);

    // Sync with backend in background
    try {
      await artworkStorage.approve(id);

      // Refresh prompts to get updated completion status
      if (pendingArtwork.promptId) {
        refreshPrompts();
      }
    } catch (error) {
      console.error('Failed to approve artwork:', error);
      // Revert on error
      setPendingArtworks(prev => [pendingArtwork, ...prev]);
      setArtworks(prev => prev.filter(a => a.id !== id));
    }
  }, [pendingArtworks, refreshPrompts]);

  const rejectArtwork = useCallback(async (id: string) => {
    // Optimistic update - instant UI feedback
    const artwork = pendingArtworks.find(a => a.id === id);

    // Update UI immediately
    setPendingArtworks(prev => prev.filter(a => a.id !== id));

    // Sync with backend in background
    try {
      await artworkStorage.reject(id);
    } catch (error) {
      console.error('Failed to reject artwork:', error);
      // Revert on error
      if (artwork) {
        setPendingArtworks(prev => [artwork, ...prev]);
      }
    }
  }, [pendingArtworks]);

  const deleteArtwork = useCallback(async (id: string) => {
    // Optimistic update - instant UI feedback
    const approvedArtwork = artworks.find(a => a.id === id);
    const pendingArtwork = pendingArtworks.find(a => a.id === id);

    // Update UI immediately
    setArtworks(prev => prev.filter(a => a.id !== id));
    setPendingArtworks(prev => prev.filter(a => a.id !== id));

    // Sync with backend in background
    try {
      await artworkStorage.delete(id);
    } catch (error) {
      console.error('Failed to delete artwork:', error);
      // Revert on error
      if (approvedArtwork) {
        setArtworks(prev => [approvedArtwork, ...prev]);
      }
      if (pendingArtwork) {
        setPendingArtworks(prev => [pendingArtwork, ...prev]);
      }
    }
  }, [artworks, pendingArtworks]);

  const refreshArtworks = useCallback(async () => {
    const [approved, pending] = await Promise.all([
      artworkStorage.getApproved(),
      artworkStorage.getPending(),
    ]);
    setArtworks(approved);
    setPendingArtworks(pending);
  }, []);

  // Admin operations
  const login = useCallback((password: string) => {
    // In a real app, this would be a proper authentication system
    if (password === 'admin123') {
      adminStorage.login();
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    adminStorage.logout();
    setIsAdmin(false);
  }, []);

  const value: AppContextType = {
    isLoading,
    prompts,
    addPrompt,
    updatePrompt,
    deletePrompt,
    addEmailToPrompt,
    completePrompt,
    refreshPrompts,
    artworks,
    pendingArtworks,
    addArtwork,
    approveArtwork,
    rejectArtwork,
    deleteArtwork,
    refreshArtworks,
    isAdmin,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
