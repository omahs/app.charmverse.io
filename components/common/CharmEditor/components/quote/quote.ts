import { type BaseRawNodeSpec } from '@bangle.dev/core';
import {
  DOMOutputSpec,
  Node
} from '@bangle.dev/pm';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

const name = 'quote';

export function spec (): BaseRawNodeSpec {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: (): DOMOutputSpec => {
        return ['blockquote', 0];
      }
    },
    markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) => {
        state.wrapBlock('> ', undefined, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: name
        }
      }
    }
  };
}
