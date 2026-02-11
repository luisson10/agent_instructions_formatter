import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import { Button } from '../ui/Button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Braces } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { cn } from '../ui/Button';
import { VariableNode } from './extensions/VariableNode';
import { normalizeHierarchicalNumbering, toHierarchicalMarkdown } from '../../lib/transformer';

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const RichTextEditor = ({ content, onChange, onUndo, onRedo }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Typography,
      VariableNode, // Nuestra nueva extensión
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: true,
        breaks: true,
      }),
    ],
    content: content, 
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-slate prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
      handleKeyDown: (_view, event) => {
        const key = event.key.toLowerCase();
        const isMod = event.metaKey || event.ctrlKey;

        if (isMod && key === 'z') {
          event.preventDefault();
          if (event.shiftKey) onRedo();
          else onUndo();
          return true;
        }

        if (isMod && key === 'y') {
          event.preventDefault();
          onRedo();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      const normalizedMarkdown = toHierarchicalMarkdown(markdown);
      onChange(normalizedMarkdown);
    },
  });



  const insertVariable = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    let name = 'funcion';

    if (!empty) {
        name = editor.state.doc.textBetween(from, to);
    } else {
        // Si no hay selección, pedimos nombre o usamos default
        // Podríamos abrir un prompt, pero por simplicidad usamos placeholder
        const promptName = window.prompt("Nombre de la variable:", "");
        if (promptName) name = promptName;
        else return; // Cancelado
    }
    
    editor.chain().focus().insertContent({
        type: 'variableFunction',
        attrs: { name }
    }).run();
    
  }, [editor]);

  // Efecto para sincronizar cambios externos
  useEffect(() => {
    if (!editor) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentEditorMarkdown = (editor.storage as any).markdown.getMarkdown();
    const normalizedCurrent = toHierarchicalMarkdown(currentEditorMarkdown);

    if (content !== normalizedCurrent) {
        // Truco de Hidratación:
        // Si el contenido entrante tiene el formato de texto {{ '\{\{...\}\}' }},
        // Lo reemplazamos con un placeholder HTML temporal que nuestra extensión sí entienda,
        // O usamos insertContent que es inteligente.
        
        // Pero como tiptap-markdown no parsea nuestro formato custom automáticamente,
        // lo más limpio es inyectar el contenido, y luego correr una pasada de reemplazo.
        
        // Estrategia: Reemplazo de string crudo antes de setContent.
        // Convertimos "{{ '\{\{name\}\}' }}" a <span data-type="variable-function" name="name"></span>
        // Y dejamos que Tiptap parseHTML haga el resto.
        
        const normalizedForEditor = normalizeHierarchicalNumbering(content);
        const hydratedContent = normalizedForEditor.replace(
            /{{\s*'\\\{\\\{(.+?)\\\}\\\}'\s*}}/g, 
            (_, name) => `<span data-type="variable-function" name="${name}"></span>`
        );
        
        editor.commands.setContent(hydratedContent);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const activeClass = (isActive: boolean) => 
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800';

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 overflow-x-auto shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('bold')))}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('italic')))}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        {/* Botón de Variable */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertVariable}
          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
          title="Insertar Función Variable"
        >
          <Braces className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-slate-700 mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('heading', { level: 1 })))}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('heading', { level: 2 })))}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('heading', { level: 3 })))}
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px h-4 bg-slate-700 mx-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('bulletList')))}
          title="Lista con viñetas"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", activeClass(editor.isActive('orderedList')))}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      {/* Área de Edición */}
      <div className="flex-1 overflow-auto cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};
