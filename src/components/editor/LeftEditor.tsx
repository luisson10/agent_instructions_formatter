import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Undo, Redo, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { RichTextEditor } from './RichTextEditor';

export const LeftEditor = () => {
  const { markdown, setMarkdown, undo, redo, clear, historyIndex, history } = useAppStore();
  const commitTimer = useRef<number | null>(null);
  const lastCommitted = useRef(markdown);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handler para cambios desde el editor visual
  // Importante: No queremos llenar el historial con cada keystroke del visual,
  // pero Zustand ya maneja eso si pushToHistory es true (default).
  // Para performance, el RichEditor hace debounce interno o Tiptap es eficiente.
  const handleVisualChange = (newMarkdown: string) => {
     setMarkdown(newMarkdown, false); // No history push on every char to avoid spam
     if (commitTimer.current) window.clearTimeout(commitTimer.current);
     commitTimer.current = window.setTimeout(() => {
        if (newMarkdown !== lastCommitted.current) {
          setMarkdown(newMarkdown, true);
          lastCommitted.current = newMarkdown;
        }
     }, 600);
  };

  useEffect(() => {
    lastCommitted.current = markdown;
  }, [historyIndex, markdown]);

  useEffect(() => {
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Toolbar Izquierda */}
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400 px-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Humano (visual)</span>
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
        <RichTextEditor
          content={markdown}
          onChange={handleVisualChange}
        />
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 text-[10px] text-slate-500 border-t border-slate-800">
        <span>Caracteres: {markdown.length}</span>
        <span>Tokens aprox: {Math.ceil(markdown.length / 4)}</span>
      </div>
    </div>
  );
};
