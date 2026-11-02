import AppError from '../utils/AppError.js'

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default function createRequireAllowedOrigin(allowedOrigins) {
  return function requireAllowedOrigin(request, _response, next) {
    const origin = request.get('origin')
    if (
      STATE_CHANGING_METHODS.has(request.method) &&
      origin &&
      !allowedOrigins.includes(origin)
    ) {
      next(new AppError('Request origin is not allowed.', 403, 'ORIGIN_FORBIDDEN'))
      return
    }
    next()
  }
}
