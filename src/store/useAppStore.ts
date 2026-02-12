import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { keepOnlyNewlineEscapes, toSingleLine, toMultiLine } from '../lib/transformer';
import type { TransformOptions } from '../lib/transformer';

interface AppState {
  markdown: string;
  singleLine: string;
  options: TransformOptions;
  
  // Historial
  history: string[]; // Guardamos solo el markdown para simplificar
  historyIndex: number;

  // Actions
  setMarkdown: (text: string, pushToHistory?: boolean) => void;
  setSingleLine: (text: string) => void;
  applySingleLineInput: (text: string) => void;
  setOption: (key: keyof TransformOptions, value: boolean) => void;
  
  transformToSingle: () => void;
  transformToMulti: () => void;
  
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 20;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      markdown: '',
      singleLine: '',
      options: {
        normalizeSpaces: false,
        wrapInQuotes: false,
        escapeInternalQuotes: false,
      },
      history: [''],
      historyIndex: 0,

      setMarkdown: (text, pushToHistory = true) => {
        const { history, historyIndex } = get();
        
        if (pushToHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(text);
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            
            set({ 
                markdown: text, 
                history: newHistory, 
                historyIndex: newHistory.length - 1 
            });
        } else {
            set({ markdown: text });
        }
        
        // Auto-transform si lo deseamos reactivo, o esperar a user interaction.
        // Por UX de "editor", mejor dejar que el usuario edite y se transforme on-the-fly o manual.
        // Para este requerimiento, haremos transform on-the-fly para la vista derecha.
        get().transformToSingle();
      },

      setSingleLine: (text) => {
        set({ singleLine: text });
        // No auto-transformamos hacia la izquierda automáticamente al escribir para evitar saltos molestos,
        // pero sí permitimos "pegar y transformar" mediante un botón o acción explicita en la UI.
      },

      applySingleLineInput: (text) => {
        const { options, history, historyIndex } = get();
        const sanitizedInput = keepOnlyNewlineEscapes(text);
        const nextMarkdown = toMultiLine(sanitizedInput, options);
        const nextSingleLine = toSingleLine(nextMarkdown, options);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(nextMarkdown);
        if (newHistory.length > MAX_HISTORY) newHistory.shift();

        set({
          markdown: nextMarkdown,
          singleLine: nextSingleLine,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      setOption: (key, value) => {
        set((state) => ({
          options: { ...state.options, [key]: value }
        }));
        // Re-calcular derecha
        get().transformToSingle();
      },

      transformToSingle: () => {
        const { markdown, options } = get();
        const result = toSingleLine(markdown, options);
        set({ singleLine: result });
      },

      transformToMulti: () => {
        const { singleLine, options } = get();
        const sanitizedInput = keepOnlyNewlineEscapes(singleLine);
        const result = toMultiLine(sanitizedInput, options);
        get().setMarkdown(result, true);
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const previousMarkdown = history[newIndex];
          set({ 
              historyIndex: newIndex, 
              markdown: previousMarkdown 
          });
          get().transformToSingle();
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextMarkdown = history[newIndex];
          set({ 
              historyIndex: newIndex, 
              markdown: nextMarkdown 
          });
          get().transformToSingle();
        }
      },

      clear: () => {
          get().setMarkdown('', true);
      }
    }),
    {
      name: 'prompt-architect-storage',
      partialize: (state) => ({ 
          options: state.options,
          // No persistimos historial largo para evitar bloat, tal vez solo el último estado
          markdown: state.markdown 
      }),
    }
  )
);
