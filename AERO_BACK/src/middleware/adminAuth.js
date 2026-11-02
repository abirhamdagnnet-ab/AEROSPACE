import asyncHandler from './asyncHandler.js'

function createAuthMiddleware(authService, requirePasswordChange = false) {
  return asyncHandler(async (request, response, next) => {
    const token = request.cookies?.aerocampus_admin
    const session = await authService.authenticate(token)
    if (!session || session.user.role !== 'admin') {
      response.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Administrator authentication is required.' },
      })
      return
    }
    if (requirePasswordChange && session.user.mustChangePassword) {
      response.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Change your password before using the administrator workspace.',
        },
      })
      return
    }
    request.adminSession = session
    request.admin = session.user
    next()
  })
}

export function createRequireAuthenticated(authService) {
  return createAuthMiddleware(authService)
}

export function createRequireAdmin(authService) {
  return createAuthMiddleware(authService, true)
}

export function createRequireCsrf(authService) {
  return function requireCsrf(request, response, next) {
    const token = request.cookies?.aerocampus_admin
    const csrfToken = request.get('x-csrf-token')
    if (!authService.verifyCsrfToken(token, csrfToken)) {
      response.status(403).json({
        success: false,
        error: { code: 'CSRF_INVALID', message: 'A valid CSRF token is required.' },
      })
      return
    }
    next()
  }
}
