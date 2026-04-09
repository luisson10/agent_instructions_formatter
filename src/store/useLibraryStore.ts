import { create } from 'zustand';
import { api } from '../lib/api';
import { useAppStore } from './useAppStore';
import type { Collection, Prompt } from '../types/library';

interface LibraryState {
  // Data
  collections: Collection[];
  expandedCollections: Set<string>;
  prompts: Record<string, Prompt[]>;

  // UI state
  sidebarOpen: boolean;
  activePromptId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCollections: () => Promise<void>;
  fetchPrompts: (collectionId: string) => Promise<void>;
  toggleCollection: (id: string) => void;

  createCollection: (name: string) => Promise<void>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  loadPrompt: (id: string) => Promise<void>;
  savePrompt: (collectionId: string, name: string) => Promise<void>;
  updatePrompt: (id: string) => Promise<void>;
  renamePrompt: (id: string, name: string) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  collections: [],
  expandedCollections: new Set<string>(),
  prompts: {},

  sidebarOpen: true,
  activePromptId: null,
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const { collections } = await api.getCollections();
      set({ collections, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchPrompts: async (collectionId: string) => {
    try {
      const { prompts: fetched } = await api.getPrompts(collectionId);
      set((state) => ({
        prompts: { ...state.prompts, [collectionId]: fetched },
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  toggleCollection: (id: string) => {
    set((state) => {
      const next = new Set(state.expandedCollections);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch prompts if not cached
        if (!state.prompts[id]) {
          get().fetchPrompts(id);
        }
      }
      return { expandedCollections: next };
    });
  },

  createCollection: async (name: string) => {
    set({ error: null });
    try {
      await api.createCollection(name);
      await get().fetchCollections();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  renameCollection: async (id: string, name: string) => {
    set({ error: null });
    try {
      await api.updateCollection(id, { name });
      await get().fetchCollections();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteCollection: async (id: string) => {
    set({ error: null });
    try {
      await api.deleteCollection(id);
      set((state) => {
        const next = new Set(state.expandedCollections);
        next.delete(id);
        const prompts = { ...state.prompts };
        delete prompts[id];
        return { expandedCollections: next, prompts };
      });
      await get().fetchCollections();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  loadPrompt: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { prompt } = await api.getPrompt(id);
      const appStore = useAppStore.getState();
      appStore.setMarkdown(prompt.content || '', true);
      set({ activePromptId: id, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  savePrompt: async (collectionId: string, name: string) => {
    set({ error: null });
    try {
      const { markdown, singleLine } = useAppStore.getState();
      const { prompt } = await api.createPrompt(collectionId, name, markdown, singleLine);
      set({ activePromptId: prompt.id });
      await get().fetchPrompts(collectionId);
      // Update collection count
      await get().fetchCollections();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updatePrompt: async (id: string) => {
    set({ error: null });
    try {
      const { markdown, singleLine } = useAppStore.getState();
      const { prompt } = await api.updatePrompt(id, {
        content: markdown,
        single_line: singleLine,
      });
      // Refresh the collection's prompt list
      if (prompt.collection_id) {
        await get().fetchPrompts(prompt.collection_id);
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  renamePrompt: async (id: string, name: string) => {
    set({ error: null });
    try {
      const { prompt } = await api.updatePrompt(id, { name });
      if (prompt.collection_id) {
        await get().fetchPrompts(prompt.collection_id);
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deletePrompt: async (id: string) => {
    set({ error: null });
    try {
      // Find collection before deleting
      const state = get();
      let collectionId: string | null = null;
      for (const [cid, prompts] of Object.entries(state.prompts)) {
        if (prompts.some((p) => p.id === id)) {
          collectionId = cid;
          break;
        }
      }

      await api.deletePrompt(id);

      if (state.activePromptId === id) {
        set({ activePromptId: null });
      }
      if (collectionId) {
        await get().fetchPrompts(collectionId);
        await get().fetchCollections();
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
