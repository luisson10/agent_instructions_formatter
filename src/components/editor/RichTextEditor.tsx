import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import { Button } from '../ui/Button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Braces } from 'lucide-react';
import { useEffect, useCallback, useRef } from 'react';
import { cn } from '../ui/Button';
import { VariableNode } from './extensions/VariableNode';
import { LogicGateNode } from './extensions/LogicGateNode';
import { CustomOrderedList } from './extensions/CustomOrderedList';
import { SlashCommandExtension, SlashCommandMenu } from './extensions/SlashCommand';
import { normalizeHierarchicalNumbering, toHierarchicalMarkdown } from '../../lib/transformer';
import { LOGIC_GATE_KEYWORDS } from './extensions/logicGateKeywords';

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const isApplyingExternalUpdate = useRef(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        orderedList: false, // Usamos CustomOrderedList en su lugar
      }),
      CustomOrderedList,
      Typography,
      VariableNode,
      LogicGateNode,
      SlashCommandExtension,
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
      // Ctrl+Z/Y lo maneja Tiptap nativamente (StarterKit history).
      // Es granular por operación, no por snapshots de 600ms.
    },
    onUpdate: ({ editor }) => {
      if (isApplyingExternalUpdate.current) return;
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
    const normalizedIncoming = toHierarchicalMarkdown(content);

    if (normalizedIncoming !== normalizedCurrent) {
        // Truco de Hidratación:
        // Si el contenido entrante tiene el formato de texto {{ '\{\{...\}\}' }},
        // Lo reemplazamos con un placeholder HTML temporal que nuestra extensión sí entienda,
        // O usamos insertContent que es inteligente.
        
        // Pero como tiptap-markdown no parsea nuestro formato custom automáticamente,
        // lo más limpio es inyectar el contenido, y luego correr una pasada de reemplazo.
        
        // Estrategia: Reemplazo de string crudo antes de setContent.
        // Convertimos "{{ '\{\{name\}\}' }}" a <span data-type="variable-function" name="name"></span>
        // Y dejamos que Tiptap parseHTML haga el resto.
        
        const normalizedForEditor = normalizeHierarchicalNumbering(normalizedIncoming);
        // Hidratar variables: {{ '\{\{name\}\}' }} → <span data-type="variable-function">
        let hydratedContent = normalizedForEditor.replace(
            /{{\s*'\\\{\\\{(.+?)\\\}\\\}'\s*}}/g,
            (_, name) => `<span data-type="variable-function" name="${name}"></span>`
        );
        // Hidratar logic gates: keywords como palabras standalone → <span data-type="logic-gate">
        // Matchea keywords precedidos por whitespace/inicio y seguidos por whitespace/fin/puntuación.
        // Esto evita matchear dentro de HTML attributes o nombres de variables.
        const keywordPattern = LOGIC_GATE_KEYWORDS.map(k => k.keyword).join('|');
        const logicGateRegex = new RegExp(`(^|\\s)(${keywordPattern})(?=\\s|$|[,:.;!?)])`, 'gm');
        hydratedContent = hydratedContent.replace(
            logicGateRegex,
            (_, before, keyword) => `${before}<span data-type="logic-gate" data-keyword="${keyword}"></span>`
        );

        isApplyingExternalUpdate.current = true;
        editor.commands.setContent(hydratedContent);
        queueMicrotask(() => {
          isApplyingExternalUpdate.current = false;
        });
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

      {/* Slash Command Menu */}
      <SlashCommandMenu editor={editor} />
    </div>
  );
};
