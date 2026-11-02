import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { fileURLToPath } from 'node:url'
import { pool } from './config/db.js'
import errorHandler from './middleware/errorHandler.js'
import notFound from './middleware/notFound.js'
import createApiRouter from './routes/apiRoutes.js'
import createAdminRouter from './routes/adminRoutes.js'
import { createCategoryRepository } from './repositories/categoryRepository.js'
import { createContactRepository } from './repositories/contactRepository.js'
import { createPostRepository } from './repositories/postRepository.js'
import { createAdminService } from './services/adminService.js'
import { createAdminAuthService } from './services/adminAuthService.js'
import { createCategoryService } from './services/categoryService.js'
import { createContactService } from './services/contactService.js'
import { createHealthService } from './services/healthService.js'
import { createPostService } from './services/postService.js'

export function createApp(overrides = {}) {
  const app = express()
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0)
  if (Number.isInteger(proxyHops) && proxyHops > 0) app.set('trust proxy', proxyHops)
  const uploadDirectory = overrides.uploadDirectory || fileURLToPath(new URL('../uploads/', import.meta.url))
  const database = overrides.database ?? pool
  const services = {
    health: overrides.health ?? createHealthService(database),
    posts: overrides.posts ?? createPostService(createPostRepository(database)),
    categories: overrides.categories ?? createCategoryService(createCategoryRepository(database)),
    contacts: overrides.contacts ?? createContactService(createContactRepository(database)),
    admin: overrides.admin ?? createAdminService(database),
    auth: overrides.auth ?? createAdminAuthService(database, overrides.sessionSecret),
  }

  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  app.use(helmet())
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use('/api/v1/uploads', express.static(uploadDirectory, { maxAge: '1y', immutable: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use('/api/v1', createApiRouter(services))
  app.use('/api/v1', createAdminRouter({
    authService: services.auth,
    adminService: services.admin,
    allowedOrigins,
    uploadDirectory,
  }))

  app.use(notFound)
  app.use(errorHandler)

  return app
}

export default createApp()
