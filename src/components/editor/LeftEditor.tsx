import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Undo, Redo, Trash2, Code2, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { RichTextEditor } from './RichTextEditor';

export const LeftEditor = () => {
  const { markdown, setMarkdown, undo, redo, clear, historyIndex, history } = useAppStore();
  const [mode, setMode] = React.useState<'code' | 'visual'>('code');

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handler para cambios desde el editor visual
  // Importante: No queremos llenar el historial con cada keystroke del visual,
  // pero Zustand ya maneja eso si pushToHistory es true (default).
  // Para performance, el RichEditor hace debounce interno o Tiptap es eficiente.
  const handleVisualChange = (newMarkdown: string) => {
     setMarkdown(newMarkdown, false); // No history push on every char to avoid spam
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Toolbar Izquierda */}
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
             <button 
                onClick={() => setMode('code')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${mode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Code2 className="w-3.5 h-3.5" />
                Markdown
             </button>
             <button 
                onClick={() => setMode('visual')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${mode === 'visual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <FileText className="w-3.5 h-3.5" />
                Visual
             </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <Button variant="ghost" size="icon" onClick={clear} title="Limpiar todo">
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Área de Edición */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'visual' ? (
           // key={markdown} fuerza el re-render si cambia externamente (ej: undo/redo)
           // para sincronizar el contenido inicial.
          <RichTextEditor 
            key={historyIndex} 
            content={markdown} 
            onChange={handleVisualChange} 
          />
        ) : (
          <textarea
            className="w-full h-full bg-slate-900 text-slate-100 p-4 resize-none outline-none font-mono text-sm leading-relaxed"
            placeholder="Escribe tus instrucciones aquí (soporta Markdown)..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        )}
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 text-[10px] text-slate-500 border-t border-slate-800">
        <span>Caracteres: {markdown.length}</span>
        <span>Tokens aprox: {Math.ceil(markdown.length / 4)}</span>
      </div>
    </div>
  );
};
