import OrderedList from '@tiptap/extension-ordered-list';
import { InputRule } from '@tiptap/core';

/**
 * Extiende OrderedList para:
 * 1. Que el CSS counter-reset respete el atributo `start`
 * 2. InputRule para números jerárquicos: escribir "2.3. " crea lista anidada con start correcto
 */
export const CustomOrderedList = OrderedList.extend({
  renderHTML({ HTMLAttributes }) {
    const start = HTMLAttributes.start ?? 1;
    const attrs = { ...HTMLAttributes };

    if (start !== 1) {
      attrs.style = `counter-reset: section ${start - 1}`;
    }

    return ['ol', attrs, 0];
  },

  addInputRules() {
    const parentRules = this.parent?.() ?? [];

    // Match hierarchical numbers at start of a text block: "2.3. " or "1.2.3. "
    const hierarchicalRule = new InputRule({
      find: /^(\d+(?:\.\d+)+)\.\s$/,
      handler: ({ state, range, match }) => {
        const numbers = match[1].split('.').map((n: string) => parseInt(n, 10));

        // Build nested orderedList → listItem → orderedList → listItem → paragraph
        // from innermost to outermost
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let node: any = {
          type: 'paragraph',
        };

        for (let i = numbers.length - 1; i >= 0; i--) {
          node = {
            type: 'orderedList',
            attrs: { start: numbers[i] },
            content: [
              {
                type: 'listItem',
                content: [node],
              },
            ],
          };
        }

        const { tr } = state;
        tr.delete(range.from, range.to);
        tr.insert(range.from, state.schema.nodeFromJSON(node));
      },
    });

    return [...parentRules, hierarchicalRule];
  },
});
