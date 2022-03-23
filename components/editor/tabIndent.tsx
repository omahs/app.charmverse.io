import { RawPlugins, RawSpecs } from '@bangle.dev/core';
import { Command, DOMOutputSpec, keymap, sinkListItem, liftListItem } from '@bangle.dev/pm';

const name = 'tabIndent';

export function spec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      group: 'inline',
      parseDOM: [{ tag: 'span.tab' }],
      toDOM: (): DOMOutputSpec => ['span', { className: 'tab', style: 'white-space:pre' }, '\t'],
      attrs: {}
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function plugins (): RawPlugins {
  return [
    keymap({
      // 'Shift-Tab': undentListItem,
      Tab: (state, dispatch) => {
        if (dispatch) {
          console.log('create tab', state.tr);
          dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
        }
        return true;
      }
    })
  ];
}
