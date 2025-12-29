import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VariableComponent } from './VariableComponent';

export const VariableNode = Node.create({
  name: 'variableFunction',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: {
        default: 'funcion',
        parseHTML: element => element.getAttribute('name'),
        renderHTML: attributes => {
          return {
            name: attributes.name,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable-function"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'variable-function' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableComponent)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const name = node.attrs.name;
          state.write(`{{ '\\{\\{${name}\\}\\}' }}`);
        },
      }
    }
  },
});
