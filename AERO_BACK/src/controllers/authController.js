import asyncHandler from '../middleware/asyncHandler.js'
import { validateLogin, validatePasswordChange } from '../validation/admin.js'
import AppError from '../utils/AppError.js'

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.ADMIN_COOKIE_SAME_SITE || 'strict',
  path: '/api/v1',
  maxAge: 12 * 60 * 60 * 1000,
})

export function createAuthController(authService) {
  return {
    login: asyncHandler(async (request, response) => {
      const credentials = validateLogin(request.body)
      const session = await authService.login(credentials)
      if (!session) {
        response.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
        })
        return
      }
      response.cookie('aerocampus_admin', session.token, cookieOptions())
      response.json({
        success: true,
        data: { user: session.user, csrfToken: session.csrfToken },
      })
    }),

    current: asyncHandler(async (request, response) => {
      response.json({
        success: true,
        data: {
          user: request.admin,
          mustChangePassword: request.admin.mustChangePassword,
          csrfToken: request.adminSession.csrfToken,
        },
      })
    }),

    changePassword: asyncHandler(async (request, response) => {
      const credentials = validatePasswordChange(request.body)
      const changed = await authService.changePassword({
        ...credentials,
        userId: request.admin.id,
        tokenHash: request.adminSession.tokenHash,
      })
      if (!changed) {
        throw new AppError(
          'Current password is incorrect or the new password is unchanged.',
          400,
          'PASSWORD_CHANGE_FAILED'
        )
      }
      response.json({ success: true, data: { message: 'Password changed successfully.' } })
    }),

    logout: asyncHandler(async (request, response) => {
      await authService.logout(request.adminSession.tokenHash)
      const { maxAge: _maxAge, ...clearOptions } = cookieOptions()
      response.clearCookie('aerocampus_admin', clearOptions)
      response.json({ success: true, data: { message: 'Signed out.' } })
    }),
  }
}
