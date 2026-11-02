import { rateLimit } from 'express-rate-limit'

export default function createContactRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many contact submissions. Try again later.' },
    },
  })
}
