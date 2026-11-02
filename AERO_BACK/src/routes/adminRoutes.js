import { Router } from 'express'
import { createAdminController } from '../controllers/adminController.js'
import { createAuthController } from '../controllers/authController.js'
import { createRequireAdmin, createRequireAuthenticated, createRequireCsrf } from '../middleware/adminAuth.js'
import createLoginRateLimit from '../middleware/loginRateLimit.js'
import createRequireAllowedOrigin from '../middleware/requireAllowedOrigin.js'
import { receiveImage, saveImage } from '../middleware/imageUpload.js'

export default function createAdminRouter({ authService, adminService, allowedOrigins, uploadDirectory }) {
  const router = Router()
  const auth = createAuthController(authService)
  const admin = createAdminController(adminService)
  const requireAllowedOrigin = createRequireAllowedOrigin(allowedOrigins)

  router.post('/auth/login', requireAllowedOrigin, createLoginRateLimit(), auth.login)

  const requireAdmin = createRequireAdmin(authService)
  const requireAuthenticated = createRequireAuthenticated(authService)
  const requireCsrf = createRequireCsrf(authService)
  const protectedRouter = Router()
  protectedRouter.use(requireAllowedOrigin)
  protectedRouter.get('/auth/me', requireAuthenticated, auth.current)
  protectedRouter.post('/auth/password', requireAuthenticated, requireCsrf, auth.changePassword)
  protectedRouter.post('/auth/logout', requireAuthenticated, requireCsrf, auth.logout)
  protectedRouter.use('/admin', requireAdmin)
  protectedRouter.use('/admin', (request, response, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      requireCsrf(request, response, next)
      return
    }
    next()
  })
  protectedRouter.get('/admin/dashboard', admin.dashboard)
  protectedRouter.get('/admin/posts', admin.listPosts)
  protectedRouter.get('/admin/posts/:id', admin.getPost)
  protectedRouter.get('/admin/contact-messages', admin.listContactMessages)
  protectedRouter.delete('/admin/contact-messages/:id', admin.deleteContactMessage)
  protectedRouter.post('/admin/uploads', (request, response, next) => {
    request.uploadDirectory = uploadDirectory
    next()
  }, receiveImage, saveImage, admin.uploadImage)
  protectedRouter.post('/admin/posts', admin.createPost)
  protectedRouter.put('/admin/posts/:id', admin.updatePost)
  protectedRouter.delete('/admin/posts/:id', admin.deletePost)
  protectedRouter.get('/admin/categories', admin.listCategories)
  protectedRouter.post('/admin/categories', admin.createCategory)
  protectedRouter.put('/admin/categories/:id', admin.updateCategory)
  protectedRouter.delete('/admin/categories/:id', admin.deleteCategory)
  router.use(protectedRouter)
  return router
}
