import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import charmClient from 'charmClient';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useBounties } from 'hooks/useBounties';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useVotes } from 'hooks/useVotes';
import { AssignedBountyPermissions } from 'lib/bounties';
import { Page, PageContent } from 'models';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { memo, useCallback, useEffect, useState } from 'react';
import BountyProperties from './components/BountyProperties';
import CreateVoteBox from './components/CreateVoteBox';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

export const Container = styled(Box)<{ top: number, fullWidth?: boolean }>`
  width: ${({ fullWidth }) => fullWidth ? '100%' : '860px'};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};

  padding: 0 24px;
  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;

export interface DocumentPageProps {
  page: Page, setPage: (p: Partial<Page>) => void,
  readOnly?: boolean,
  insideModal?: boolean
}

function DocumentPage ({ page, setPage, insideModal, readOnly = false }: DocumentPageProps) {
  const { pages, getPagePermissions } = usePages();
  const { cancelVote, castVote, deleteVote, votes, isLoading } = useVotes();
  const pagePermissions = getPagePermissions(page.id);
  const { draftBounty } = useBounties();
  // Only populate bounty permission data if this is a bounty page
  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);

  async function refreshBountyPermissions (bountyId: string) {
    setBountyPermissions(await charmClient.computeBountyPermissions({
      resourceId: bountyId
    }));
  }

  useEffect(() => {
    if (page.bountyId) {
      refreshBountyPermissions(page.bountyId);
    }
  }, [page.bountyId]);

  const cannotEdit = readOnly || !pagePermissions?.edit_content;
  const cannotComment = readOnly || !pagePermissions?.comment;

  const pageVote = Object.values(votes).find(v => v.context === 'proposal');
  const [isSuggestMode, setIsSuggestMode] = useState<boolean>(false);
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

  const { currentPageActionDisplay } = usePageActionDisplay();

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = useAppSelector(getCardComments(card?.id ?? page.id));

  const showPageActionSidebar = (currentPageActionDisplay !== null) && !insideModal;
  const router = useRouter();
  const isSharedPage = router.pathname.startsWith('/share');

  return (
    <ScrollableWindow
      sx={{
        overflow: {
          md: showPageActionSidebar ? 'hidden' : 'auto'
        }
      }}
    >
      <Box sx={{
        width: {
          md: showPageActionSidebar ? 'calc(100% - 425px)' : '100%'
        },
        height: {
          md: showPageActionSidebar ? 'calc(100vh - 65px)' : '100%'
        },
        overflow: {
          md: showPageActionSidebar ? 'auto' : 'inherit'
        }
      }}
      >
        {page.deletedAt && <PageDeleteBanner pageId={page.id} />}
        {page.headerImage && <PageBanner headerImage={page.headerImage} readOnly={cannotEdit} setPage={setPage} />}
        <Button onClick={() => {
          setIsSuggestMode(!isSuggestMode);
        }}
        >{isSuggestMode ? 'Edit Mode' : 'Suggestion Mode'}
        </Button>
        <Container
          top={pageTop}
          fullWidth={page.fullWidth ?? false}
        >
          <CharmEditor
            suggestMode={isSuggestMode}
            key={`${page.id}.${isSuggestMode}`}
            content={page.content as PageContent}
            onContentChange={updatePageContent}
            readOnly={cannotEdit}
            pageActionDisplay={!insideModal ? currentPageActionDisplay : null}
            pageId={page.id}
            disablePageSpecificFeatures={isSharedPage}
            enableVoting={true}
            suggestion={page.documentSuggestion?.[0]?.suggestion}
          >
            <PageHeader
              headerImage={page.headerImage}
              icon={page.icon}
              title={page.title}
              readOnly={cannotEdit}
              setPage={setPage}
            />
            {page.type === 'proposal' && !isLoading && pageVote && (
              <Box my={2}>
                <VoteDetail
                  cancelVote={cancelVote}
                  deleteVote={deleteVote}
                  castVote={castVote}
                  vote={pageVote}
                  detailed={false}
                  isProposal={true}
                />
              </Box>
            )}
            <div className='focalboard-body'>
              <div className='CardDetail content'>
                {/* Property list */}
                {card && board && (
                  <CardDetailProperties
                    board={board}
                    card={card}
                    cards={cards}
                    activeView={activeView}
                    views={boardViews}
                    readonly={cannotEdit}
                    pageUpdatedAt={page.updatedAt.toString()}
                    pageUpdatedBy={page.updatedBy}
                  />
                )}
                {(draftBounty || page.bountyId) && (
                  <BountyProperties
                    bountyId={page.bountyId}
                    pageId={page.id}
                    readOnly={cannotEdit}
                    permissions={bountyPermissions}
                    refreshBountyPermissions={refreshBountyPermissions}
                  />
                )}
                {(page.type === 'bounty' || page.type === 'card') && (
                  <CommentsList
                    comments={comments}
                    rootId={card?.rootId ?? page.id}
                    cardId={card?.id ?? page.id}
                    readonly={cannotComment}
                  />
                )}
              </div>
            </div>
          </CharmEditor>

          {page.type === 'proposal' && !isLoading && !pageVote && (
            <CreateVoteBox />
          )}
        </Container>
      </Box>
    </ScrollableWindow>
  );
}

export default memo(DocumentPage);
