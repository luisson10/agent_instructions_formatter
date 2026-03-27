import OrderedList from '@tiptap/extension-ordered-list';

/**
 * Extiende OrderedList para que el CSS counter-reset respete el atributo `start`.
 * Sin esto, los CSS counters (que muestran 1.1., 1.2., etc.) siempre empiezan en 1
 * aunque el <ol> tenga start="3".
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
});
