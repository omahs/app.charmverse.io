import type { Page, Prisma, PrismaPromise } from '@prisma/client';

import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function createPage<T>({ data, include }: Prisma.PageCreateArgs): PrismaPromise<Page & T> {
  const createArgs: Prisma.PageCreateArgs = {
    data: {
      ...data,
      hasContent: data.content ? !checkIsContentEmpty(data.content as PageContent) : false,
      galleryImage: extractPreviewImage(data.content as PageContent)
    }
  };

  const includeData =
    typeof include !== undefined
      ? include
      : {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        };

  createArgs.include = includeData;

  return prisma.page.create(createArgs) as unknown as PrismaPromise<Page & T>;
}
