import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

// Componente React para el chip visual
const VariableComponent = ({ node }: any) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-medium bg-green-900 text-green-300 border border-green-700 select-none cursor-default font-mono">
      <span className="opacity-50 mr-1">ƒ</span>
      {node.attrs.name}
    </span>
  );
};

export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true, // Es una unidad indivisible (se borra todo junto)

  addAttributes() {
    return {
      name: {
        default: 'funcion',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'variable' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableComponent)
  },

  // Regla para convertir a/desde Markdown
  addStorage() {
    return {
        markdown: {
            serialize(state: any, node: any) {
                // Aquí definimos cómo se escribe en el archivo final
                // Output: {{ '\{\{name\}\}' }}
                state.write(`{{ '\\{\\{${node.attrs.name}\\}\\}' }}`);
            },
            parse: {
                // Esta parte es difícil: detectar el patrón en texto plano y convertirlo a nodo.
                // Tiptap Markdown no trae un parser de regex simple para nodos inline custom.
                // Por ahora, nos enfocaremos en que la inserción funcione.
                // La detección al cargar desde markdown requeriría una extensión markdown-it.
            }
        }
    }
  },
});


