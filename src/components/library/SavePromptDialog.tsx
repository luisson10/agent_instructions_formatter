import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { Button } from '../ui/Button';

interface SavePromptDialogProps {
  onClose: () => void;
}

export function SavePromptDialog({ onClose }: SavePromptDialogProps) {
  const { collections, savePrompt, createCollection } = useLibraryStore();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections[0]?.id ?? '__new__'
  );
  const [promptName, setPromptName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [saving, setSaving] = useState(false);

  const isNewCollection = selectedCollectionId === '__new__';

  const handleSave = async () => {
    if (!promptName.trim()) return;
    setSaving(true);

    try {
      let collectionId = selectedCollectionId;

      if (isNewCollection) {
        if (!newCollectionName.trim()) return;
        await createCollection(newCollectionName.trim());
        // Get the newly created collection
        const updated = useLibraryStore.getState().collections;
        const created = updated.find((c) => c.name === newCollectionName.trim());
        if (!created) throw new Error('No se pudo crear la colección');
        collectionId = created.id;
      }

      await savePrompt(collectionId, promptName.trim());
      onClose();
    } catch {
      // Error is set in the store
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute bottom-14 left-2 right-2 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-200">Guardar prompt</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Colección</label>
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new__">+ Nueva colección</option>
          </select>
        </div>

        {isNewCollection && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre de colección</label>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Mi colección"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nombre del prompt</label>
          <input
            type="text"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
            placeholder="system-prompt-v1"
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            autoFocus={!isNewCollection}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !promptName.trim() || (isNewCollection && !newCollectionName.trim())}
            className="flex-1"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
