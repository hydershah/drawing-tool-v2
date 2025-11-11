/**
 * Application context for managing global state
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Prompt, Artwork } from '@/types';
import { promptStorage, artworkStorage, adminStorage } from '@/services/supabase-storage';

interface AppContextType {
  // Prompts
  prompts: Prompt[];
  addPrompt: (prompt: string, email: string) => Promise<Prompt>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  refreshPrompts: () => void;

  // Artworks
  artworks: Artwork[];
  pendingArtworks: Artwork[];
  addArtwork: (data: {
    imageData: string;
    promptId?: string;
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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize data from storage
  useEffect(() => {
    const loadData = async () => {
      const [allPrompts, approvedArtworks, pendingArtworksData] = await Promise.all([
        promptStorage.getAll(),
        artworkStorage.getApproved(),
        artworkStorage.getPending(),
      ]);

      setPrompts(allPrompts);
      setArtworks(approvedArtworks);
      setPendingArtworks(pendingArtworksData);
      setIsAdmin(adminStorage.isLoggedIn());
    };

    loadData();
  }, []);

  // Prompt operations
  const addPrompt = useCallback(async (prompt: string, email: string) => {
    const newPrompt = await promptStorage.create(prompt, email);
    setPrompts(prev => [...prev, newPrompt]);
    return newPrompt;
  }, []);

  const updatePrompt = useCallback((id: string, updates: Partial<Prompt>) => {
    // Optimistic update - backend will sync on next refresh
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePrompt = useCallback(async (id: string) => {
    await promptStorage.delete(id);
    setPrompts(prev => prev.filter(p => p.id !== id));
  }, []);

  const refreshPrompts = useCallback(async () => {
    const allPrompts = await promptStorage.getAll();
    setPrompts(allPrompts);
  }, []);

  // Artwork operations
  const addArtwork = useCallback(async (data: {
    imageData: string;
    promptId?: string;
    promptText?: string;
    artistName?: string;
    artistEmail?: string;
    isAdminCreated: boolean;
  }) => {
    const newArtwork = await artworkStorage.create(data);

    if (newArtwork.status === 'approved') {
      setArtworks(prev => [...prev, newArtwork]);
    } else {
      setPendingArtworks(prev => [...prev, newArtwork]);
    }

    // Refresh prompts to get updated status (backend marks as completed)
    if (data.promptId) {
      await refreshPrompts();
    }

    return newArtwork;
  }, [refreshPrompts]);

  const approveArtwork = useCallback(async (id: string) => {
    await artworkStorage.approve(id);
    const artwork = await artworkStorage.getById(id);
    if (artwork) {
      setPendingArtworks(prev => prev.filter(a => a.id !== id));
      setArtworks(prev => [...prev, artwork]);
    }
  }, []);

  const rejectArtwork = useCallback(async (id: string) => {
    await artworkStorage.reject(id);
    setPendingArtworks(prev => prev.filter(a => a.id !== id));
  }, []);

  const deleteArtwork = useCallback(async (id: string) => {
    await artworkStorage.delete(id);
    setArtworks(prev => prev.filter(a => a.id !== id));
    setPendingArtworks(prev => prev.filter(a => a.id !== id));
  }, []);

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
    prompts,
    addPrompt,
    updatePrompt,
    deletePrompt,
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
