import { Router } from 'express'
import { createCategoriesController } from '../controllers/categoriesController.js'
import { createHealthController } from '../controllers/healthController.js'
import { createContactController } from '../controllers/contactController.js'
import { createPostsController } from '../controllers/postsController.js'
import createContactRateLimit from '../middleware/contactRateLimit.js'

export default function createApiRouter({
  health,
  posts,
  categories,
  contacts,
} = {}) {
  const router = Router()
  const healthController = createHealthController(health)
  const postsController = createPostsController(posts)
  const categoriesController = createCategoriesController(categories)
  const contactController = createContactController(contacts)

  router.get('/health', healthController)
  router.get('/posts', postsController.list)
  router.get('/posts/:slug', postsController.details)
  router.get('/categories', categoriesController.list)
  router.post('/contact', createContactRateLimit(), contactController.create)

  return router
}
