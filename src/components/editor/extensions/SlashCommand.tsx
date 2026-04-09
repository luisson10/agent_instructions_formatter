import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Editor } from '@tiptap/react';
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FC,
} from 'react';
import { createPortal } from 'react-dom';
import { LOGIC_GATE_KEYWORDS } from './logicGateKeywords';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlashMenuItem {
  id: string;
  keyword: string;
  label: string;
  description: string;
  example: string;
  section: string;
  color: string; // tailwind badge color class
  action: (editor: Editor) => void;
}

interface SlashMenuState {
  open: boolean;
  filter: string;
  slashPos: number;
  coords: { left: number; bottom: number };
}

// ---------------------------------------------------------------------------
// Menu items definition
// ---------------------------------------------------------------------------

const buildItems = (onInsertVariable: (editor: Editor) => void): SlashMenuItem[] => {
  const variableItem: SlashMenuItem = {
    id: 'variable',
    keyword: '{{ }}',
    label: 'Variable',
    description: 'Inserta una función variable en el texto',
    example: '{{ nombre_cliente }}',
    section: 'Insertar',
    color: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    action: onInsertVariable,
  };

  const gateItems: SlashMenuItem[] = LOGIC_GATE_KEYWORDS.map((g) => ({
    id: `gate-${g.keyword}`,
    keyword: g.keyword,
    label: g.label,
    description: g.description,
    example: g.example,
    section: 'Compuertas Lógicas',
    color: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    action: (editor: Editor) => {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'logicGate', attrs: { keyword: g.keyword } })
        .insertContent(' ')
        .run();
    },
  }));

  return [variableItem, ...gateItems];
};

// ---------------------------------------------------------------------------
// ProseMirror plugin key (singleton)
// ---------------------------------------------------------------------------

const slashCommandPluginKey = new PluginKey('slashCommand');

// ---------------------------------------------------------------------------
// Tiptap Extension
// ---------------------------------------------------------------------------

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addStorage() {
    return {
      onSlashOpen: null as ((pos: number, coords: { left: number; bottom: number }) => void) | null,
      onSlashClose: null as (() => void) | null,
      onSlashUpdate: null as ((filter: string) => void) | null,
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage as {
      onSlashOpen: ((pos: number, coords: { left: number; bottom: number }) => void) | null;
      onSlashClose: (() => void) | null;
      onSlashUpdate: ((filter: string) => void) | null;
    };

    let active = false;
    let slashPos = 0;

    return [
      new Plugin({
        key: slashCommandPluginKey,
        props: {
          handleKeyDown(view, event) {
            // Open menu on "/"
            if (event.key === '/' && !active) {
              const { from } = view.state.selection;
              // Don't open if cursor is inside a code block
              const $pos = view.state.doc.resolve(from);
              if ($pos.parent.type.name === 'codeBlock') return false;

              active = true;
              slashPos = from;

              // Defer so the "/" character is inserted first
              requestAnimationFrame(() => {
                const coords = view.coordsAtPos(from + 1);
                storage.onSlashOpen?.(from, { left: coords.left, bottom: coords.bottom });
              });
              return false;
            }

            if (!active) return false;

            // Close on Escape
            if (event.key === 'Escape') {
              active = false;
              storage.onSlashClose?.();
              return true;
            }

            // Arrow navigation and Enter are handled by the React component
            // We just need to prevent ProseMirror from consuming them
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter') {
              return true; // swallow — React handles these via window listener
            }

            return false;
          },

          handleTextInput(view, _from, _to, text) {
            if (!active) return false;

            // After a character is typed, update filter
            requestAnimationFrame(() => {
              const currentPos = view.state.selection.from;
              // +1 because slashPos is BEFORE the "/" char
              const filterText = view.state.doc.textBetween(slashPos + 1, currentPos, '');
              storage.onSlashUpdate?.(filterText);
            });

            // If typing a space, close the menu
            if (text === ' ') {
              active = false;
              storage.onSlashClose?.();
            }

            return false;
          },
        },

        // Watch for Backspace and deletion that might remove the "/"
        filterTransaction(tr) {
          if (!active) return true;

          // After the transaction, check if slash is still there
          requestAnimationFrame(() => {
            if (!active) return;
            try {
              const doc = tr.doc;
              const sel = tr.selection;
              const cursorPos = sel.from;

              // If cursor moved before or at slashPos, close
              if (cursorPos <= slashPos) {
                active = false;
                storage.onSlashClose?.();
                return;
              }

              // Check the character at slashPos is still "/"
              const charAtSlash = doc.textBetween(slashPos, slashPos + 1, '');
              if (charAtSlash !== '/') {
                active = false;
                storage.onSlashClose?.();
                return;
              }

              // Update filter text
              const filterText = doc.textBetween(slashPos + 1, cursorPos, '');
              storage.onSlashUpdate?.(filterText);
            } catch {
              active = false;
              storage.onSlashClose?.();
            }
          });

          return true;
        },
      }),
    ];
  },
});

// ---------------------------------------------------------------------------
// React Menu Component
// ---------------------------------------------------------------------------

interface SlashCommandMenuProps {
  editor: Editor | null;
}

export const SlashCommandMenu: FC<SlashCommandMenuProps> = ({ editor }) => {
  const [state, setState] = useState<SlashMenuState>({
    open: false,
    filter: '',
    slashPos: 0,
    coords: { left: 0, bottom: 0 },
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  // Build items — variable insertion triggers prompt then inserts
  const allItems = useRef(
    buildItems((ed) => {
      const promptName = window.prompt('Nombre de la variable:', '');
      if (!promptName) return;
      ed.chain()
        .focus()
        .insertContent({ type: 'variableFunction', attrs: { name: promptName } })
        .insertContent(' ')
        .run();
    }),
  ).current;

  // Filtered items
  const filteredItems = state.filter
    ? allItems.filter(
        (item) =>
          item.keyword.toLowerCase().includes(state.filter.toLowerCase()) ||
          item.label.toLowerCase().includes(state.filter.toLowerCase()) ||
          item.description.toLowerCase().includes(state.filter.toLowerCase()),
      )
    : allItems;

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [state.filter]);

  // Scroll active item into view
  useEffect(() => {
    if (!itemsRef.current) return;
    const active = itemsRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Close if no editor
  const closeMenu = useCallback(() => {
    setState((s) => ({ ...s, open: false, filter: '' }));
    setSelectedIndex(0);
  }, []);

  const executeItem = useCallback(
    (item: SlashMenuItem) => {
      if (!editor) return;
      const from = state.slashPos;
      const to = editor.state.selection.from;

      if (item.id === 'variable') {
        // Variable uses window.prompt (blocking), so separate chains are fine
        editor.chain().focus().deleteRange({ from, to }).run();
        item.action(editor);
      } else {
        // Logic gates: single chain so onUpdate fires once with the complete state
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent({ type: 'logicGate', attrs: { keyword: item.keyword } })
          .insertContent(' ')
          .run();
      }
      closeMenu();
    },
    [editor, state.slashPos, closeMenu],
  );

  // Wire up editor storage callbacks
  useEffect(() => {
    if (!editor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = (editor.storage as any).slashCommand as {
      onSlashOpen: ((pos: number, coords: { left: number; bottom: number }) => void) | null;
      onSlashClose: (() => void) | null;
      onSlashUpdate: ((filter: string) => void) | null;
    };

    storage.onSlashOpen = (pos, coords) => {
      setState({ open: true, filter: '', slashPos: pos, coords });
      setSelectedIndex(0);
    };

    storage.onSlashClose = () => closeMenu();

    storage.onSlashUpdate = (filter) => {
      setState((s) => ({ ...s, filter }));
    };

    return () => {
      storage.onSlashOpen = null;
      storage.onSlashClose = null;
      storage.onSlashUpdate = null;
    };
  }, [editor, closeMenu]);

  // Keyboard navigation (window-level to capture events ProseMirror swallowed)
  useEffect(() => {
    if (!state.open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) executeItem(item);
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [state.open, filteredItems, selectedIndex, executeItem, closeMenu]);

  // Close on click outside
  useEffect(() => {
    if (!state.open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [state.open, closeMenu]);

  if (!state.open || filteredItems.length === 0) return null;

  // Group items by section
  const sections: Record<string, SlashMenuItem[]> = {};
  for (const item of filteredItems) {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  }

  const focusedItem = filteredItems[selectedIndex] ?? filteredItems[0];

  // Absolute counter for global index across sections
  let globalIdx = 0;

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-50 flex gap-0"
      style={{
        left: `${state.coords.left}px`,
        top: `${state.coords.bottom - 8}px`,
        transform: 'translateY(-100%)',
      }}
    >
      {/* Left column — command list */}
      <div
        ref={itemsRef}
        className="w-[320px] max-h-[380px] overflow-y-auto rounded-l-lg border border-r-0 border-slate-700 bg-slate-900 shadow-2xl py-1"
      >
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName}>
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
              {sectionName}
            </div>
            {items.map((item) => {
              const idx = globalIdx++;
              const isActive = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  data-active={isActive}
                  className={`
                    flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm transition-colors duration-75 cursor-pointer
                    ${isActive ? 'bg-slate-800 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent hover:bg-slate-800/50'}
                  `}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Don't steal focus from editor
                    executeItem(item);
                  }}
                >
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border select-none min-w-[40px] text-center ${item.color}`}
                  >
                    {item.keyword}
                  </span>
                  <span className="text-slate-300 truncate">{item.description}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Right column — tooltip panel */}
      {focusedItem && (
        <div className="w-[280px] rounded-r-lg border border-l-0 border-slate-700 bg-slate-900 shadow-2xl p-4 flex flex-col gap-3">
          <div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border select-none ${focusedItem.color}`}
            >
              {focusedItem.keyword}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Descripción
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{focusedItem.description}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Ejemplo
            </div>
            <div className="bg-slate-950 rounded-md px-3 py-2 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800">
              {focusedItem.example}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(menu, document.body);
};
