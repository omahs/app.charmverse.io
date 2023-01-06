import * as googlForms from '@googleapis/forms';
import type { PagePermission, Prisma, Block as PrismaBlock } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import { blockToPrisma, prismaToBlock } from 'lib/focalboard/block';
import type { Block, PrismaBlockSortOf } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardViewFields, GoogleFormSourceData } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import log from 'lib/log';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { copyAllPagePermissions } from 'lib/permissions/pages/actions/copyPermission';
import { WrongStateError } from 'lib/utilities/errors/invalidData';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

import { getClient } from '../authorization/authClient';
import { getCredential } from '../authorization/credentials';

import { syncThrottlePeriod, userEmailProperty, responseLinkProperty } from './config';

type GoogleForm = googlForms.forms_v1.Schema$Form;
type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

// the rootId is the id of the top-level board, from which we inherit permissions
export async function syncFormResponses({ createdBy, view }: { createdBy: string; view: PrismaBlock }) {
  const rootId = view.rootId;
  const viewId = view.id;
  const fields = view.fields as BoardViewFields;
  const sourceData = fields.sourceData;
  if (fields.sourceType !== 'google_form' || !sourceData) {
    throw new WrongStateError('Board is not set up to connect to Google');
  }

  // First, set up the board or "database" block, including the cardProperties based on form questions
  const { board, hasRefreshedRecently, lastUpdated, responseCount } = await getHiddenDatabaseBlock(sourceData);
  const rootBoardPage = await prisma.page.findUniqueOrThrow({ where: { id: rootId }, include: { permissions: true } });
  board.createdBy = createdBy;
  board.spaceId = rootBoardPage.spaceId;
  board.parentId = rootId;
  board.rootId = rootId;
  board.updatedBy = createdBy;

  if (hasRefreshedRecently) {
    log.debug('Skip refreshing board because it was refreshed recently', { syncThrottlePeriod });
    return;
  }

  // Retrieve the form and responses
  const { form, responses } = await getFormAndResponses(sourceData, lastUpdated);

  const { cardProperties, cards, pages } = getCardsAndPages({
    cardParentId: board.id,
    rootId,
    createdBy,
    form,
    responses,
    nextIndex: responseCount + 1,
    permissions: rootBoardPage.permissions,
    spaceId: rootBoardPage.spaceId
  });
  board.fields.cardProperties = cardProperties;

  const createOrUpdateBoard = prisma.block.upsert({
    where: {
      id: board.id
    },
    create: blockToPrisma(board),
    update: {
      fields: board.fields,
      updatedAt: new Date()
    }
  });

  // add the boardId to the view's sourceData
  sourceData.boardId = board.id;
  fields.visiblePropertyIds = cardProperties.map((p) => p.id);

  const updateView = lastUpdated ? [] : [prisma.block.update({ where: { id: viewId }, data: { fields } })];

  const createCards = prisma.block.createMany({ data: cards });
  const createPages = pages.map((data) => prisma.page.create({ data }));

  // save to db
  await prisma.$transaction([createOrUpdateBoard, ...updateView, createCards, ...createPages]);

  const pageIds = pages.map((p) => p.id).filter(isTruthy);

  log.info('Synced Google form responses', { boardId: board.id, formId: form.formId, responseCount: responses.length });

  await notifyUsers({
    spaceId: board.spaceId,
    pageIds,
    blocks: [board, prismaToBlock(view), ...cards.map((card) => prismaToBlock(card))]
  });
}

// retrieve or generate the board block which contains card properties
async function getHiddenDatabaseBlock({ boardId }: { boardId?: string } = {}) {
  const boardBlock = boardId ? await prisma.block.findUnique({ where: { id: boardId } }) : null;
  if (boardId && !boardBlock) {
    log.warn('Suspicious state: source boardId exists but board not found', { boardId });
  }

  const now = new Date();
  const defaultBoardValues: Partial<Block> = { createdAt: now.getTime() };
  const board = (boardBlock ?? createBoard({ block: defaultBoardValues })) as Block;

  const hasRefreshedRecently = now.getTime() - board.updatedAt > syncThrottlePeriod;
  const isNewBoard = now.getTime() === board.createdAt;
  const lastUpdated = isNewBoard ? null : now;
  const responseCount = await prisma.block.count({ where: { rootId: board.id } });

  return { board, hasRefreshedRecently, lastUpdated, responseCount };
}

async function getFormAndResponses(sourceData: GoogleFormSourceData, lastUpdated: Date | null) {
  const { formId } = sourceData;
  const credential = await getCredential({ credentialId: sourceData.credentialId });
  const forms = _getFormsClient(credential.refreshToken);

  const { data: form } = await forms.forms.get({
    formId
  });

  // retrieve only the latest responses since we last updated
  let pageToken: string | null | undefined = 'default';
  const responses: GoogleFormResponse[] = [];
  let maxCalls = 20; // avoid endless loop
  while (pageToken && maxCalls > 0) {
    const res = await forms.forms.responses.list({
      // filter: lastUpdated ? `timestamp >= '${lastUpdated.toISOString()}'` : undefined,
      formId
    });
    if (res.data.responses) {
      responses.push(...res.data.responses);
    }
    pageToken = res.data.nextPageToken;
    maxCalls -= 1;
  }

  // should never happen, but let us know if it does
  if (maxCalls === 0) {
    log.error(
      'Reached max calls when checking for Google form responses. Check if it is safe to increase the limit',
      sourceData
    );
  }
  return { form, responses };
}

async function notifyUsers({ blocks, pageIds, spaceId }: { spaceId: string; pageIds: string[]; blocks: Block[] }) {
  await Promise.all([
    async () => {
      relay.broadcast(
        {
          type: 'blocks_created',
          payload: blocks
        },
        spaceId
      );
    },
    async () => {
      const createdPages = await getPageMetaList(pageIds);
      relay.broadcast(
        {
          type: 'pages_created',
          payload: createdPages
        },
        spaceId
      );
    }
  ]);
}

// utils
function getCardsAndPages({
  cardParentId,
  rootId,
  createdBy,
  form,
  responses,
  nextIndex,
  permissions,
  spaceId
}: {
  cardParentId: string;
  rootId: string;
  createdBy: string;
  form: GoogleForm;
  responses: GoogleFormResponse[];
  nextIndex: number;
  permissions: PagePermission[];
  spaceId: string;
}) {
  const cardProperties = getCardProperties(form);

  const cardBlocks: PrismaBlockSortOf[] = [];
  const cardPages: Prisma.PageCreateInput[] = []; // for now, return a Prisma object so we can include permissions

  for (const response of responses) {
    const responseId = response.responseId;
    const createdAt = response.createTime ?? new Date().toISOString();
    const responseAnswers = getAnswersFromResponse({
      formId: form.formId as string,
      properties: cardProperties,
      response
    });
    const cardBlock = createCard({
      createdAt: new Date(createdAt).getTime(),
      createdBy,
      updatedBy: createdBy,
      parentId: cardParentId,
      rootId,
      spaceId,
      fields: {
        properties: responseAnswers,
        responseId
      }
    });
    const prismaBlock = blockToPrisma(cardBlock);
    cardBlocks.push(blockToPrisma(cardBlock));

    const initialPermissions = copyAllPagePermissions({
      permissions,
      inheritFrom: true,
      newPageId: cardBlock.id
    });

    // logic copied from blocks api
    initialPermissions.data = (initialPermissions.data as any[]).map((permission) => {
      delete permission.pageId;

      return {
        ...permission
      };
    });

    const cardPage: Prisma.PageCreateInput = {
      author: {
        connect: {
          id: cardBlock.createdBy
        }
      },
      updatedBy: cardBlock.updatedBy,
      id: cardBlock.id,
      space: {
        connect: {
          id: cardBlock.spaceId
        }
      },
      card: {
        connect: {
          id: cardBlock.id
        }
      },
      createdAt: prismaBlock.createdAt,
      title: `Response ${nextIndex}`,
      type: 'card',
      contentText: '',
      parentId: rootId, // important to inherit permissions
      path: `path-${uuid()}`,
      updatedAt: prismaBlock.updatedAt,
      permissions: {
        createMany: initialPermissions
      }
    };
    cardPages.push(cardPage);
    nextIndex += 1;
  }

  return { cardProperties, cards: cardBlocks, pages: cardPages };
}

function getCardProperties(form: GoogleForm): IPropertyTemplate[] {
  const properties: IPropertyTemplate[] = [
    {
      id: userEmailProperty,
      name: 'Respondent Email',
      type: 'email',
      options: []
    },
    {
      id: responseLinkProperty,
      name: 'Link to response',
      type: 'url',
      options: []
    }
  ];

  form.items?.forEach((item) => {
    const questionId = item?.questionItem?.question?.questionId;

    if (questionId) {
      const choiceQuestion = item.questionItem?.question?.choiceQuestion;
      const options = (choiceQuestion?.options ?? [])
        .map(
          (choice): IPropertyOption => ({
            id: choice.value ?? '',
            value: choice.value ?? '',
            color: ''
          })
        )
        // filter out options like { isOther: true }
        .filter((option) => option.id !== '');

      const hasIsOther = choiceQuestion?.options?.some((option) => option.isOther);
      const prop: IPropertyTemplate = {
        id: questionId,
        name: item.title ?? questionId,
        type: 'text',
        options
      };

      if (choiceQuestion?.type === 'RADIO' || (choiceQuestion?.type === 'DROP_DOWN' && !hasIsOther)) {
        prop.type = 'select';
      } else if (choiceQuestion?.type === 'CHECKBOX') {
        prop.type = 'multiSelect';
      }
      properties.push(prop);
    }
  });

  return properties;
}

function getAnswersFromResponse({
  formId,
  properties,
  response
}: {
  formId?: string;
  properties: IPropertyTemplate[];
  response: GoogleFormResponse;
}): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};

  if (response.respondentEmail) {
    values[userEmailProperty] = response.respondentEmail;
  }

  // add the URL to view the response
  values[responseLinkProperty] = `https://docs.google.com/forms/d/${formId}/edit#response=${response.responseId}`;

  Object.values(response.answers ?? {}).forEach((answer) => {
    const question = properties.find((prop) => prop.id === answer.questionId);
    if (question) {
      const propId = question.id;
      if (question.type === 'number' && answer.grade) {
        if (answer.grade.score) {
          values[propId] = answer.grade.score?.toString() ?? '';
        } else {
          values[propId] = answer.grade.correct ? 'Correct' : 'Incorrect';
        }
      } else if (question.type === 'select' || question.type === 'multiSelect') {
        values[propId] = (answer.textAnswers?.answers ?? []).map((a) => a.value).filter(isTruthy);
      } else if (question.type === 'text') {
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      } else {
        // textAnswer is a fallback for all other types
        // https://developers.google.com/forms/api/reference/rest/v1/forms.responses#TextAnswer
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      }
    }
  });

  return values;
}

function _getFormsClient(refreshToken: string) {
  const auth = getClient();
  auth.setCredentials({
    refresh_token: refreshToken
  });
  return googlForms.forms({
    version: 'v1',
    auth
  });
}
