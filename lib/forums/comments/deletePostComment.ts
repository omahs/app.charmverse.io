import type { PostComment } from '@prisma/client';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

export async function deletePostComment({ commentId }: { commentId: string }): Promise<PostComment> {
  const postComment = await prisma.postComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      contentText: ''
    },
    include: {
      post: {
        select: {
          spaceId: true,
          id: true,
          category: true
        }
      }
    }
  });

  if (postComment.post.category) {
    trackUserAction('delete_comment', {
      categoryName: postComment.post.category.name,
      commentedOn: postComment.parentId === null ? 'post' : 'comment',
      postId: postComment.post.id,
      resourceId: commentId,
      spaceId: postComment.post.spaceId,
      userId: postComment.createdBy
    });
  }

  return postComment;
}
