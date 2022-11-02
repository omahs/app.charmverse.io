import type {
  BangleEditorProps as CoreBangleEditorProps
} from '@bangle.dev/core';
import {
  BangleEditor as CoreBangleEditor
} from '@bangle.dev/core';
import type { Plugin } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { nodeViewUpdateStore, useNodeViews } from '@bangle.dev/react/node-view-helpers';
import { objectUid } from '@bangle.dev/utils';
import type { ReactNode, RefObject } from 'react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';

import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { isTouchScreen } from 'lib/utilities/browser';

import { FidusEditor } from '../../fiduswriter/fiduseditor';

import { NodeViewWrapper } from './NodeViewWrapper';
import type { RenderNodeViewsFunction } from './NodeViewWrapper';

interface BangleEditorProps<PluginMetadata = any> extends CoreBangleEditorProps<PluginMetadata> {
  pageId?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor<PluginMetadata>) => void;
  editorRef?: RefObject<HTMLDivElement>;
  enableSuggestions?: boolean; // requires trackChanges to be true
  trackChanges?: boolean;
}

export const BangleEditor = React.forwardRef<
  CoreBangleEditor | undefined,
  BangleEditorProps
>(
  (
    {
      pageId,
      state,
      children,
      focusOnInit = !isTouchScreen(),
      pmViewOpts,
      renderNodeViews,
      className,
      style,
      onReady = () => {},
      editorRef,
      enableSuggestions = false,
      trackChanges = false
    },
    ref
  ) => {
    const renderRef = useRef<HTMLDivElement>(null);
    const onReadyRef = useRef(onReady);
    const editorViewPayloadRef = useRef({
      state,
      focusOnInit,
      pmViewOpts,
      enableSuggestions
    });
    const [editor, setEditor] = useState<CoreBangleEditor>();
    const nodeViews = useNodeViews(renderRef);
    const { user } = useUser();
    const { showMessage } = useSnackbar();

    const enableFidusEditor = Boolean(user && pageId && trackChanges);
    const [isLoading, setIsLoading] = useState(enableFidusEditor);

    if (enableSuggestions && !trackChanges) {
      log.error('CharmEditor: Suggestions require trackChanges to be enabled');
    }

    // set current
    editorViewPayloadRef.current.enableSuggestions = enableSuggestions;

    useImperativeHandle(
      ref,
      () => {
        return editor;
      },
      [editor]
    );

    function onError (message: string) {
      showMessage(message, 'error');
    }

    useEffect(() => {
      const _editor = new CoreBangleEditor(
        renderRef.current!,
        editorViewPayloadRef.current
      );
      let fEditor: FidusEditor;

      if (user && pageId && trackChanges) {
        // eslint-disable-next-line no-new
        fEditor = new FidusEditor({
          user,
          docId: pageId,
          enableSuggestionMode: enableSuggestions,
          onDocLoaded: () => {
            setIsLoading(false);
          }
        });
        fEditor.init(_editor.view, onError);
      }
      (_editor.view as any)._updatePluginWatcher = updatePluginWatcher(_editor);
      onReadyRef.current(_editor);
      setEditor(_editor);
      return () => {
        // console.log('destroy editor');
        fEditor?.close();
        _editor.destroy();
      };
    }, [user, pageId, trackChanges, ref]);

    if (nodeViews.length > 0 && renderNodeViews == null) {
      throw new Error(
        'When using nodeViews, you must provide renderNodeViews callback'
      );
    }

    return (
      <EditorViewContext.Provider value={editor?.view as any}>
        <div ref={editorRef} className='bangle-editor-core'>
          {editor ? children : null}
          <div ref={renderRef} id={pageId} className={className} style={style} />
          <LoadingComponent isLoading={isLoading} />
          {/* {editor
            ? (
              <Placeholder
                sx={placeholderSX}
                text={placeholderText}
                show={!!editor.view.state.doc.textContent}
              />
            )
            : null} */}
        </div>
        {nodeViews.map((nodeView) => {
          return reactDOM.createPortal(
            <NodeViewWrapper
              nodeViewUpdateStore={nodeViewUpdateStore}
              nodeView={nodeView}
              renderNodeViews={renderNodeViews!}
            />,
              nodeView.containerDOM!,
              objectUid.get(nodeView)
          );
        })}
      </EditorViewContext.Provider>
    );
  }
);

function updatePluginWatcher (editor: CoreBangleEditor) {
  return (watcher: Plugin, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins
    });

    editor.view.updateState(state);
  };
}
