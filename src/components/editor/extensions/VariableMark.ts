import { Mark, mergeAttributes } from '@tiptap/core';

export const VariableMark = Mark.create({
  name: 'variable',

  // Renderizar como un span normal, pero le añadiremos clases
  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-variable': '' }), 0]
  },
});



