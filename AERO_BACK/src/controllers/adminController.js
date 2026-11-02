import asyncHandler from '../middleware/asyncHandler.js'
import { validateCategoryPayload, validateId, validatePostPayload } from '../validation/admin.js'
import { parseAdminContactQuery, parseAdminPostQuery } from '../validation/adminQuery.js'

export function createAdminController(adminService) {
  return {
    dashboard: asyncHandler(async (_request, response) => {
      const dashboard = await adminService.dashboard()
      response.json({ success: true, data: dashboard })
    }),

    listPosts: asyncHandler(async (request, response) => {
      const result = await adminService.listPosts(parseAdminPostQuery(request.query))
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

    getPost: asyncHandler(async (request, response) => {
      const post = await adminService.getPost(validateId(request.params.id))
      response.json({ success: true, data: post })
    }),

    createPost: asyncHandler(async (request, response) => {
      const payload = validatePostPayload(request.body)
      const created = await adminService.createPost(payload, request.admin.id)
      const post = await adminService.getPost(created.id)
      response.status(201).json({ success: true, data: post })
    }),

    updatePost: asyncHandler(async (request, response) => {
      const id = validateId(request.params.id)
      const payload = validatePostPayload(request.body, { partial: true })
      await adminService.updatePost(id, payload)
      const post = await adminService.getPost(id)
      response.json({ success: true, data: post })
    }),

    deletePost: asyncHandler(async (request, response) => {
      const post = await adminService.deletePost(validateId(request.params.id))
      response.json({ success: true, data: { id: post.id, message: 'Article deleted.' } })
    }),

    listContactMessages: asyncHandler(async (request, response) => {
      const result = await adminService.listContactMessages(parseAdminContactQuery(request.query))
      response.json({
        success: true,
        data: result.messages,
        meta: {
          page: result.page,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        },
      })
    }),

    deleteContactMessage: asyncHandler(async (request, response) => {
      const message = await adminService.deleteContactMessage(validateId(request.params.id))
      response.json({ success: true, data: { id: message.id, message: 'Contact message deleted.' } })
    }),

    uploadImage: asyncHandler(async (request, response) => {
      response.status(201).json({
        success: true,
        data: { url: request.uploadedImageUrl },
      })
    }),

    listCategories: asyncHandler(async (_request, response) => {
      const categories = await adminService.listCategories()
      response.json({ success: true, data: categories })
    }),

    createCategory: asyncHandler(async (request, response) => {
      const category = await adminService.createCategory(validateCategoryPayload(request.body))
      response.status(201).json({ success: true, data: category })
    }),

    updateCategory: asyncHandler(async (request, response) => {
      const category = await adminService.updateCategory(
        validateId(request.params.id),
        validateCategoryPayload(request.body, { partial: true })
      )
      response.json({ success: true, data: category })
    }),

    deleteCategory: asyncHandler(async (request, response) => {
      const id = validateId(request.params.id)
      await adminService.deleteCategory(id)
      response.json({ success: true, data: { id, message: 'Category deleted.' } })
    }),
  }
}
