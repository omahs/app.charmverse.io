
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { MenuItem, ListItemIcon } from '@mui/material';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import { useCallback, memo } from 'react';
import { isTruthy } from 'lib/utilities/types';
import useNestedPage from '../hooks/useNestedPage';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { NestedPagePluginKey, NestedPagePluginState } from '../nestedPage';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';

function NestedPagesList () {

  const { addNestedPage } = useNestedPage();

  const view = useEditorViewContext();

  const {
    tooltipContentDOM,
    show: isVisible
  } = usePluginState(NestedPagePluginKey) as NestedPagePluginState;

  function onClose () {
    hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
  }
  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
    },
    [view]
  );

  return (
    <PopoverMenu container={tooltipContentDOM} isOpen={isVisible} onClose={onClose} width={460}>
      <GroupLabel>Select a page</GroupLabel>
      {isVisible && <PagesList onSelectPage={onSelectPage} />}
    </PopoverMenu>
  );
}

function PagesList ({ onSelectPage }: { onSelectPage: (page: Page) => void }): JSX.Element {
  const { pages } = usePages();

  const items = Object.values(pages).filter(isTruthy).map(page => {
    const docContent = ((page.content) as PageContent)?.content;
    const isEditorEmpty = docContent && (docContent.length <= 1
          && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0));

    return (
      <MenuItem
        onClick={() => onSelectPage(page)}
        key={page.id}
      >
        <>
          <ListItemIcon>
            <PageIcon icon={page.icon} isEditorEmpty={Boolean(isEditorEmpty)} pageType={page.type} />
          </ListItemIcon>
          <PageTitle
            hasContent={page.title.length === 0}
            sx={{
              fontWeight: 'bold'
            }}
          >
            {page.title.length !== 0 ? page.title : 'Untitled'}
          </PageTitle>
        </>
      </MenuItem>
    );
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{items}</>;
}

export default memo(NestedPagesList);
