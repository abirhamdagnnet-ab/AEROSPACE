import asyncHandler from '../middleware/asyncHandler.js'

export function createCategoriesController(categoryService) {
  return {
    list: asyncHandler(async (_request, response) => {
      const categories = await categoryService.list()
      response.json({ success: true, data: categories })
    }),
  }
}
