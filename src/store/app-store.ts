'use client';

import { create } from 'zustand';

interface AppState {
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),
}));

// Made by Gebin George. Check out my other work on gebin.net
