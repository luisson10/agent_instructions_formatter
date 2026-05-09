import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LogicGateComponent } from './LogicGateComponent';

export const LogicGateNode = Node.create({
  name: 'logicGate',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      keyword: {
        default: 'IF',
        parseHTML: element => element.getAttribute('data-keyword'),
        renderHTML: attributes => {
          return {
            'data-keyword': attributes.keyword,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="logic-gate"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'logic-gate' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LogicGateComponent);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const keyword = node.attrs.keyword;
          state.write(`[${keyword}]`);
        },
      },
    };
  },
});
