import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import { Button } from '../ui/Button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Braces } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { cn } from '../ui/Button';

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Typography,
      Markdown.configure({
        html: false,
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
    },
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
  });

  const setVariableFormat = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    if (empty) return; 

    const text = editor.state.doc.textBetween(from, to);
    
    // FORMATO CORRECTO SOLICITADO: {{ '\{\{texto\}\}' }}
    // Para que Markdown preserve los backslashes literales y no los consuma como escape,
    // debemos escribirlos dobles: \\
    // JS String: '\\\\' -> Markdown Text: '\\' -> Final Output: '\'
    const formatted = `{{ '\\\\{\\\\{${text}\\\\}\\\\}' }}`;
    
    // Insertamos como texto plano. 
    editor.chain().focus().insertContent(formatted).run();
  }, [editor]);

  // Efecto para sincronizar cambios externos
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentEditorMarkdown = (editor.storage as any).markdown.getMarkdown();

    if (content !== currentEditorMarkdown) {
        editor.commands.setContent(content);
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
          onClick={setVariableFormat}
          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
          title="Convertir a Variable de Función"
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
