import asyncHandler from '../middleware/asyncHandler.js'
import { parsePostQuery } from '../validation/postQuery.js'

export function createPostsController(postService) {
  return {
    list: asyncHandler(async (request, response) => {
      const query = parsePostQuery(request.query)
      const result = await postService.list(query)
      response.json({
        success: true,
        data: result.posts,
        meta: {
          page: result.page,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        },
      })
    }),

    details: asyncHandler(async (request, response) => {
      const post = await postService.getBySlug(request.params.slug)
      if (!post) {
        response.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Article not found.' },
        })
        return
      }
      response.json({ success: true, data: post })
    }),
  }
}
