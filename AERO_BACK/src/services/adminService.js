import { createAdminRepository } from '../repositories/adminRepository.js'
import AppError from '../utils/AppError.js'

export function createAdminService(database) {
  const repository = createAdminRepository(database)

  return {
    dashboard: () => repository.dashboard(),
    listPosts: (query) => repository.listPosts(query),
    async getPost(id) {
      const post = await repository.getPostById(id)
      if (!post) throw new AppError('Article not found.', 404, 'NOT_FOUND')
      return post
    },
    async createPost(payload, authorId) {
      try {
        return await repository.createPost({ payload, authorId })
      } catch (error) {
        if (error.code === '23503') {
          throw new AppError('The selected category or administrator is unavailable.', 400, 'VALIDATION_ERROR')
        }
        throw error
      }
    },
    async updatePost(id, payload) {
      try {
        const post = await repository.updatePost(id, payload)
        if (!post) throw new AppError('Article not found.', 404, 'NOT_FOUND')
        return post
      } catch (error) {
        if (error.code === '23503') {
          throw new AppError('The selected category is unavailable.', 400, 'VALIDATION_ERROR')
        }
        throw error
      }
    },
    async deletePost(id) {
      const post = await repository.deletePost(id)
      if (!post) throw new AppError('Article not found.', 404, 'NOT_FOUND')
      return post
    },
    listContactMessages: (query) => repository.listContactMessages(query),
    async deleteContactMessage(id) {
      const message = await repository.deleteContactMessage(id)
      if (!message) throw new AppError('Contact message not found.', 404, 'NOT_FOUND')
      return message
    },
    listCategories: () => repository.listCategories(),
    async createCategory(payload) {
      try {
        return await repository.createCategory(payload)
      } catch (error) {
        if (error.code === '23505') {
          throw new AppError('A category with that slug already exists.', 409, 'CONFLICT')
        }
        throw error
      }
    },
    async updateCategory(id, payload) {
      try {
        const category = await repository.updateCategory(id, payload)
        if (!category) throw new AppError('Category not found.', 404, 'NOT_FOUND')
        return category
      } catch (error) {
        if (error.code === '23505') {
          throw new AppError('A category with that slug already exists.', 409, 'CONFLICT')
        }
        throw error
      }
    },
    async deleteCategory(id) {
      let result
      try {
        result = await repository.deleteCategory(id)
      } catch (error) {
        if (error.code === '23503') {
          throw new AppError('This category is assigned to one or more articles.', 409, 'CATEGORY_IN_USE')
        }
        throw error
      }
      if (!result.deleted && result.inUse) {
        throw new AppError('This category is assigned to one or more articles.', 409, 'CATEGORY_IN_USE')
      }
      if (!result.deleted) throw new AppError('Category not found.', 404, 'NOT_FOUND')
    },
  }
}
