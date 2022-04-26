import { useCallback, memo, useRef } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { Page, PageContent } from 'models';
import { useThreadsDisplay } from 'components/common/PageLayout/PageLayout';
import { BountyIntegration } from 'components/bounties/BountyIntegration';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { title } from 'process';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { getCardContents } from 'components/common/BoardEditor/focalboard/src/store/contents';
import { usePages } from 'hooks/usePages';
import PageHeader from './components/PageHeader';
import PageBanner from './components/PageBanner';
import CharmEditor, { ICharmEditorOutput } from '../../common/CharmEditor/CharmEditor';

export const Container = styled(Box)<{ top: number }>`
  width: 860px;
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  padding: 0 80px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};
`;

export interface IEditorProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean }

function Editor ({ page, setPage, readOnly = false }: IEditorProps) {
  const { pages } = usePages();
  const board = useAppSelector((state) => {
    if (page.type === 'card' && page.parentId) {
      const parentPage = pages[page.parentId];
      return parentPage?.boardId && parentPage?.type === 'board' ? state.boards.boards[parentPage.boardId] : null;
    }
    return null;
  });
  const cards = useAppSelector((state) => board ? Object.values(state.cards.cards).filter(card => card.parentId === board.id) : []);
  const boardViews = useAppSelector((state) => {
    if (board) {
      return Object.values(state.views.views).filter(view => view.parentId === board.id);
    }
    return [];
  });

  const activeView = boardViews[0];

  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  }
  else if (page.icon) {
    pageTop = 200;
  }

  const { showingCommentThreadsList } = useThreadsDisplay();

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = card ? useAppSelector(getCardComments(card.id)) : [];
  const contents = card ? useAppSelector(getCardContents(card.id)) : [];
  const commentThreadsListRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollableWindow>
      <Box display='flex' gap={1}>
        <div style={{
          width: showingCommentThreadsList ? 'calc(100% - 550px)' : '100%'
        }}
        >
          {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
          <Container
            top={pageTop}
          >
            <CharmEditor
              commentThreadsListRef={commentThreadsListRef}
              key={page.id}
              content={page.content as PageContent}
              onContentChange={updatePageContent}
              readOnly={readOnly}
              showingCommentThreadsList={showingCommentThreadsList}
            >
              <PageHeader
                headerImage={page.headerImage}
                icon={page.icon}
                title={page.title}
                readOnly={readOnly}
                setPage={setPage}
              />
              {card && board && (
              <div className='CardDetail content'>
                {/* Property list */}
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'space-between',
                  width: '100%'
                }}
                >
                  <CardDetailProperties
                    board={board}
                    card={card}
                    contents={contents}
                    cards={cards}
                    comments={comments}
                    activeView={activeView}
                    views={boardViews}
                    readonly={readOnly}
                  />
                  <BountyIntegration linkedTaskId={card.id} title={title} readonly={readOnly} />
                </Box>

                <hr />
                <CommentsList
                  comments={comments}
                  rootId={card.rootId}
                  cardId={card.id}
                  readonly={readOnly}
                />
              </div>
              )}
            </CharmEditor>
          </Container>
        </div>
        <div
          ref={commentThreadsListRef}
          className='PageThreadList-portal'
          style={{
            width: 500,
            right: '50px',
            position: 'fixed',
            overflow: 'auto',
            height: 'calc(100% - 65px)',
            paddingRight: '10px',
            // This is required to make the scroll work
            display: showingCommentThreadsList ? 'initial' : 'none'
          }}
        />
      </Box>
    </ScrollableWindow>
  );
}

export default memo(Editor);
