import AppError from '../utils/AppError.js'

export default function notFound(_request, _response, next) {
  next(new AppError('The requested resource was not found.', 404, 'NOT_FOUND'))
}
