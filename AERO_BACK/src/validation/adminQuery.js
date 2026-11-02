import AppError from '../utils/AppError.js'

export function parseAdminPostQuery(query) {
  const errors = []
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const status = typeof query.status === 'string' ? query.status : ''
  const categoryId = typeof query.categoryId === 'string' ? query.categoryId : ''

  if (!Number.isInteger(page) || page < 1) errors.push({ field: 'page', message: 'Page must be a positive integer.' })
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push({ field: 'limit', message: 'Limit must be between 1 and 100.' })
  if (query.search !== undefined && (typeof query.search !== 'string' || search.length > 120)) {
    errors.push({ field: 'search', message: 'Search must be at most 120 characters.' })
  }
  if (query.status !== undefined && !['draft', 'published'].includes(status)) {
    errors.push({ field: 'status', message: 'Status must be draft or published.' })
  }
  if (query.categoryId !== undefined && !/^[1-9]\d*$/.test(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Category ID must be a positive integer.' })
  }
  if (errors.length) throw new AppError('Query parameters are invalid.', 400, 'VALIDATION_ERROR', errors)
  return { page, limit, search, status, categoryId }
}

export function parseAdminContactQuery(query) {
  const errors = []
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) errors.push({ field: 'page', message: 'Page must be a positive integer.' })
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.push({ field: 'limit', message: 'Limit must be between 1 and 100.' })
  }
  if (errors.length) throw new AppError('Query parameters are invalid.', 400, 'VALIDATION_ERROR', errors)
  return { page, limit }
}
