import asyncHandler from '../middleware/asyncHandler.js'
import { validateContactPayload } from '../validation/contact.js'

export function createContactController(contactService) {
  return {
    create: asyncHandler(async (request, response) => {
      const payload = validateContactPayload(request.body)
      const message = await contactService.create(payload)
      response.status(201).json({
        success: true,
        data: { id: message.id, message: 'Your message was received.' },
      })
    }),
  }
}
