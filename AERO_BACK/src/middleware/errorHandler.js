import AppError from '../utils/AppError.js'

export default function errorHandler(error, request, response, _next) {
  if (error.type === 'entity.parse.failed') {
    response.status(400).json({
      success: false,
      error: { code: 'BAD_JSON', message: 'Request body must contain valid JSON.' },
    })
    return
  }
  if (error.type === 'entity.too.large') {
    response.status(413).json({
      success: false,
      error: { code: 'BODY_TOO_LARGE', message: 'Request body is too large.' },
    })
    return
  }

  if (error.code === '23505') {
    response.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with that value already exists.' },
    })
    return
  }
  if (error.code === '23503' && error.message?.includes('categories')) {
    response.status(409).json({
      success: false,
      error: { code: 'CATEGORY_IN_USE', message: 'This category is assigned to one or more articles.' },
    })
    return
  }
  if (['23503', '23514', '22P02', '22001'].includes(error.code)) {
    response.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Some submitted values are invalid.' },
    })
    return
  }

  const suppliedStatus = error.statusCode || error.status
  const statusCode = Number.isInteger(suppliedStatus) && suppliedStatus >= 400 && suppliedStatus < 600
    ? suppliedStatus
    : 500
  const isServerError = statusCode >= 500

  const isPublicAppError = error instanceof AppError

  if (isServerError) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'api_request_failed',
      method: request.method,
      route: typeof request.route?.path === 'string' ? `${request.baseUrl}${request.route.path}` : 'unmatched_route',
      statusCode,
      code: error.code || 'INTERNAL_ERROR',
      errorType: error.name || 'Error',
      causeCode: error.cause?.code || undefined,
      causeType: error.cause?.name || undefined,
    }))
  }

  const body = {
    success: false,
    error: {
      code: isServerError
          ? 'INTERNAL_ERROR'
          : error.code || (statusCode === 400 ? 'BAD_REQUEST' : 'REQUEST_ERROR'),
      message: isServerError
          ? 'An unexpected error occurred.'
          : isPublicAppError
            ? error.message
            : statusCode === 404
              ? 'The requested resource was not found.'
              : 'The request could not be completed.',
    },
  }

  if (!isServerError && isPublicAppError && error.details) {
    body.error.details = error.details
  }

  response.status(statusCode).json(body)
}
