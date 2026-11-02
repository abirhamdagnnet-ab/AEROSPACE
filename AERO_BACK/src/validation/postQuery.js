import AppError from '../utils/AppError.js'

const categorySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function parsePostQuery(query) {
  const errors = []
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 9 : Number(query.limit)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const category = typeof query.category === 'string' ? query.category.trim().toLowerCase() : ''

  if (!Number.isInteger(page) || page < 1) {
    errors.push({ field: 'page', message: 'Page must be a positive integer.' })
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.push({ field: 'limit', message: 'Limit must be an integer between 1 and 100.' })
  }
  if (query.search !== undefined && typeof query.search !== 'string') {
    errors.push({ field: 'search', message: 'Search must be a string.' })
  }
  if (search.length > 120) {
    errors.push({ field: 'search', message: 'Search must be 120 characters or fewer.' })
  }
  if (query.category !== undefined && (typeof query.category !== 'string' || !categorySlugPattern.test(category))) {
    errors.push({ field: 'category', message: 'Category must be a valid category slug.' })
  }
  if (errors.length > 0) {
    throw new AppError('Query parameters are invalid.', 400, 'VALIDATION_ERROR', errors)
  }

  return { page, limit, search, category }
}
