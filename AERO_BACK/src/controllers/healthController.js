import asyncHandler from '../middleware/asyncHandler.js'

export function createHealthController(healthService) {
  return asyncHandler(async (_request, response) => {
    try {
      const health = await healthService.check()
      response.json({ success: true, data: health })
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        event: 'database_health_check_failed',
        code: error.code || 'DATABASE_UNAVAILABLE',
        errorType: error.name || 'Error',
      }))
      response.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database connection is unavailable.' },
      })
    }
  })
}
