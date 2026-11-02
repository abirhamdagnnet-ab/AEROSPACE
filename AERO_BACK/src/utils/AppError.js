export default class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details, options) {
    super(message, options)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
