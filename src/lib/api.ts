import type { Collection, Prompt } from '../types/library';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export const api = {
  // Collections
  getCollections() {
    return request<{ collections: Collection[] }>('/api/collections');
  },

  createCollection(name: string, description?: string) {
    return request<{ collection: Collection }>('/api/collections', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  updateCollection(id: string, data: { name?: string; description?: string }) {
    return request<{ collection: Collection }>(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteCollection(id: string) {
    return request<void>(`/api/collections/${id}`, { method: 'DELETE' });
  },

  // Prompts
  getPrompts(collectionId: string) {
    return request<{ prompts: Prompt[] }>(`/api/collections/${collectionId}/prompts`);
  },

  createPrompt(collectionId: string, name: string, content?: string, singleLine?: string) {
    return request<{ prompt: Prompt }>(`/api/collections/${collectionId}/prompts`, {
      method: 'POST',
      body: JSON.stringify({ name, content, single_line: singleLine }),
    });
  },

  getPrompt(id: string) {
    return request<{ prompt: Prompt }>(`/api/prompts/${id}`);
  },

  updatePrompt(id: string, data: { name?: string; content?: string; single_line?: string }) {
    return request<{ prompt: Prompt }>(`/api/prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deletePrompt(id: string) {
    return request<void>(`/api/prompts/${id}`, { method: 'DELETE' });
  },
};
