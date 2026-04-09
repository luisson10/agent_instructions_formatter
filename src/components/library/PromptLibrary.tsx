import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Save,
  Trash2,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { SavePromptDialog } from './SavePromptDialog';
import type { Collection, Prompt } from '../../types/library';

// ── Inline editable name ────────────────────────────────────────────────
function InlineName({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (name: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <span
        className={className}
        onDoubleClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
          setEditing(false);
        }
        if (e.key === 'Escape') setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="bg-slate-800 border border-indigo-500 rounded px-1 py-0 text-sm text-slate-200 w-full focus:outline-none"
      autoFocus
    />
  );
}

// ── Context menu (…) ────────────────────────────────────────────────────
function ContextMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-50 min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onRename();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            <Pencil className="w-3 h-3" /> Renombrar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700"
          >
            <Trash2 className="w-3 h-3" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Prompt row ──────────────────────────────────────────────────────────
function PromptRow({ prompt }: { prompt: Prompt }) {
  const { activePromptId, loadPrompt, renamePrompt, deletePrompt } = useLibraryStore();
  const isActive = activePromptId === prompt.id;
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  return (
    <div
      className={`group flex items-center gap-1.5 pl-8 pr-2 py-1 cursor-pointer text-sm transition-colors ${
        isActive
          ? 'bg-slate-800 border-l-2 border-l-indigo-500 text-slate-100'
          : 'border-l-2 border-l-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
      }`}
      onClick={() => loadPrompt(prompt.id)}
    >
      <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
      {renaming ? (
        <input
          ref={inputRef}
          defaultValue={prompt.name}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val && val !== prompt.name) renamePrompt(prompt.id, val);
              setRenaming(false);
            }
            if (e.key === 'Escape') setRenaming(false);
          }}
          onBlur={() => setRenaming(false)}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 border border-indigo-500 rounded px-1 py-0 text-sm text-slate-200 flex-1 min-w-0 focus:outline-none"
          autoFocus
        />
      ) : (
        <span className="truncate flex-1 min-w-0">{prompt.name}</span>
      )}
      <ContextMenu
        onRename={() => setRenaming(true)}
        onDelete={() => deletePrompt(prompt.id)}
      />
    </div>
  );
}

// ── Collection row ──────────────────────────────────────────────────────
function CollectionRow({ collection }: { collection: Collection }) {
  const {
    expandedCollections,
    toggleCollection,
    prompts,
    renameCollection,
    deleteCollection,
  } = useLibraryStore();

  const isExpanded = expandedCollections.has(collection.id);
  const collectionPrompts = prompts[collection.id] ?? [];

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-sm hover:bg-slate-800/50 transition-colors"
        onClick={() => toggleCollection(collection.id)}
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-amber-400" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-slate-500" />
        )}
        <InlineName
          value={collection.name}
          onSave={(name) => renameCollection(collection.id, name)}
          className="truncate flex-1 min-w-0 text-slate-300"
        />
        {collection.prompt_count != null && (
          <span className="text-[10px] text-slate-600 tabular-nums">
            {collection.prompt_count}
          </span>
        )}
        <ContextMenu
          onRename={() => {
            /* handled by double-click InlineName */
          }}
          onDelete={() => deleteCollection(collection.id)}
        />
      </div>

      {isExpanded && (
        <div>
          {collectionPrompts.length === 0 ? (
            <div className="pl-10 py-1 text-xs text-slate-600 italic">Sin prompts</div>
          ) : (
            collectionPrompts.map((p) => <PromptRow key={p.id} prompt={p} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── New collection inline input ─────────────────────────────────────────
function NewCollectionInput({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const { createCollection } = useLibraryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (name.trim()) {
      await createCollection(name.trim());
    }
    onDone();
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <Folder className="w-4 h-4 shrink-0 text-slate-500" />
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onDone();
        }}
        onBlur={handleSave}
        placeholder="Nueva colección"
        className="bg-slate-800 border border-indigo-500 rounded px-1 py-0 text-sm text-slate-200 flex-1 min-w-0 placeholder:text-slate-600 focus:outline-none"
      />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function PromptLibrary() {
  const {
    collections,
    fetchCollections,
    loading,
    error,
    activePromptId,
    updatePrompt,
  } = useLibraryStore();

  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleUpdate = useCallback(() => {
    if (activePromptId) updatePrompt(activePromptId);
  }, [activePromptId, updatePrompt]);

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Libreria
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchCollections()}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreatingCollection(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="Nueva colección"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-3 py-1.5 text-xs text-red-400 bg-red-950/30 border-b border-red-900/50">
          {error}
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading && collections.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-600 text-center">Cargando...</div>
        ) : collections.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-600 text-center">
            No hay colecciones.
            <br />
            Crea una para empezar.
          </div>
        ) : (
          collections.map((c) => <CollectionRow key={c.id} collection={c} />)
        )}

        {creatingCollection && (
          <NewCollectionInput onDone={() => setCreatingCollection(false)} />
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t border-slate-800 p-2">
        {activePromptId ? (
          <button
            onClick={handleUpdate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Actualizar
          </button>
        ) : (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar prompt
          </button>
        )}

        {showSaveDialog && <SavePromptDialog onClose={() => setShowSaveDialog(false)} />}
      </div>
    </div>
  );
}
