import AppError from '../utils/AppError.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContactPayload(body) {
  const payload = {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '',
    subject: typeof body?.subject === 'string' ? body.subject.trim() : '',
    message: typeof body?.message === 'string' ? body.message.trim() : '',
  }
  const errors = []

  if (payload.name.length < 2 || payload.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters.' })
  }
  if (!emailPattern.test(payload.email) || payload.email.length > 254) {
    errors.push({ field: 'email', message: 'A valid email address is required.' })
  }
  if (payload.subject.length > 160) {
    errors.push({ field: 'subject', message: 'Subject must be 160 characters or fewer.' })
  }
  if (payload.message.length < 10 || payload.message.length > 5000) {
    errors.push({ field: 'message', message: 'Message must be between 10 and 5000 characters.' })
  }
  if (errors.length > 0) {
    throw new AppError('Contact message is invalid.', 400, 'VALIDATION_ERROR', errors)
  }

  return payload
}
