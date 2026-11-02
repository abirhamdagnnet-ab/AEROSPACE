import AppError from '../utils/AppError.js'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fail(details) {
  throw new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', details)
}

export function validateLogin(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const errors = []
  if (!emailPattern.test(email) || email.length > 254) {
    errors.push({ field: 'email', message: 'Enter a valid email address.' })
  }
  if (password.length < 1 || password.length > 200) {
    errors.push({ field: 'password', message: 'Password is required.' })
  }
  if (errors.length) fail(errors)
  return { email, password }
}

export function validatePasswordChange(body) {
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
  const errors = []
  for (const key of Object.keys(body || {})) {
    if (!['currentPassword', 'newPassword'].includes(key)) {
      errors.push({ field: key, message: 'Unknown field.' })
    }
  }
  if (currentPassword.length < 1 || currentPassword.length > 200) {
    errors.push({ field: 'currentPassword', message: 'Enter your current password.' })
  }
  if (newPassword.length < 14 || newPassword.length > 200) {
    errors.push({ field: 'newPassword', message: 'New password must be between 14 and 200 characters.' })
  }
  if (currentPassword && currentPassword === newPassword) {
    errors.push({ field: 'newPassword', message: 'Choose a password different from your current password.' })
  }
  if (errors.length) fail(errors)
  return { currentPassword, newPassword }
}

function validateImageUrl(value) {
  if (value === '') return true
  if (/^asset:(?:aviation|space|science|careers|default)$/.test(value)) return true
  if (/^\/api\/v1\/uploads\/[0-9a-f-]+\.(?:avif|jpg|png|webp)$/.test(value)) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
  } catch {
    return false
  }
}

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
    .replace(/-+$/g, '')
}

export function validatePostPayload(body, { partial = false } = {}) {
  const payload = {}
  const errors = []
  const fields = ['title', 'slug', 'excerpt', 'content', 'coverImageUrl', 'categoryId', 'status']
  for (const key of Object.keys(body || {})) {
    if (!fields.includes(key)) errors.push({ field: key, message: 'Unknown field.' })
  }

  if (!partial || body.title !== undefined) {
    payload.title = typeof body?.title === 'string' ? body.title.trim() : ''
    if (payload.title.length < 5 || payload.title.length > 180) {
      errors.push({ field: 'title', message: 'Title must be between 5 and 180 characters.' })
    }
  }
  if (!partial || body.excerpt !== undefined) {
    payload.excerpt = typeof body?.excerpt === 'string' ? body.excerpt.trim() : ''
    if (payload.excerpt.length < 20 || payload.excerpt.length > 320) {
      errors.push({ field: 'excerpt', message: 'Excerpt must be between 20 and 320 characters.' })
    }
  }
  if (!partial || body.content !== undefined) {
    payload.content = typeof body?.content === 'string' ? body.content.trim() : ''
    if (payload.content.length < 40 || payload.content.length > 50000) {
      errors.push({ field: 'content', message: 'Content must be between 40 and 50000 characters.' })
    }
  }
  if (!partial || body.coverImageUrl !== undefined) {
    payload.coverImageUrl = typeof body?.coverImageUrl === 'string' ? body.coverImageUrl.trim() : ''
    if (payload.coverImageUrl.length > 2048 || !validateImageUrl(payload.coverImageUrl)) {
      errors.push({ field: 'coverImageUrl', message: 'Cover image must be a valid HTTPS URL.' })
    }
  }
  if (!partial || body.categoryId !== undefined) {
    const categoryId = body?.categoryId
    payload.categoryId = typeof categoryId === 'string' || typeof categoryId === 'number'
      ? String(categoryId)
      : ''
    if (!/^[1-9]\d*$/.test(payload.categoryId)) {
      errors.push({ field: 'categoryId', message: 'Choose a valid category.' })
    }
  }
  if (!partial || body.status !== undefined) {
    payload.status = body?.status
    if (!['draft', 'published'].includes(payload.status)) {
      errors.push({ field: 'status', message: 'Status must be draft or published.' })
    }
  }
  if (body?.slug !== undefined) {
    if (typeof body.slug !== 'string' || body.slug.trim().length > 200 || !slugPattern.test(body.slug.trim())) {
      errors.push({ field: 'slug', message: 'Slug must contain lowercase letters, numbers, and hyphens.' })
    } else {
      payload.slug = body.slug.trim()
    }
  } else if (payload.title) {
    payload.slug = slugify(payload.title)
  }
  if (payload.title && !payload.slug) {
    errors.push({ field: 'title', message: 'Title must include letters or numbers to create a slug.' })
  }

  if (errors.length) fail(errors)
  return payload
}

export function validateCategoryPayload(body, { partial = false } = {}) {
  const payload = {}
  const errors = []
  for (const key of Object.keys(body || {})) {
    if (!['name', 'slug', 'description'].includes(key)) errors.push({ field: key, message: 'Unknown field.' })
  }

  if (!partial || body.name !== undefined) {
    payload.name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (payload.name.length < 2 || payload.name.length > 60) {
      errors.push({ field: 'name', message: 'Name must be between 2 and 60 characters.' })
    }
  }
  if (!partial || body.description !== undefined) {
    payload.description = typeof body?.description === 'string' ? body.description.trim() : ''
    if (payload.description.length > 240) {
      errors.push({ field: 'description', message: 'Description must be 240 characters or fewer.' })
    }
  }
  if (body?.slug !== undefined) {
    if (typeof body.slug !== 'string' || body.slug.trim().length > 80 || !slugPattern.test(body.slug.trim())) {
      errors.push({ field: 'slug', message: 'Slug must contain lowercase letters, numbers, and hyphens.' })
    } else {
      payload.slug = body.slug.trim()
    }
  } else if (payload.name) {
    payload.slug = slugify(payload.name).slice(0, 80).replace(/-+$/g, '')
  }
  if (payload.name && !payload.slug) {
    errors.push({ field: 'name', message: 'Name must include letters or numbers to create a slug.' })
  }

  if (errors.length) fail(errors)
  return payload
}

export function validateId(value, field = 'id') {
  if (!/^[1-9]\d*$/.test(value)) {
    fail([{ field, message: `A valid ${field} is required.` }])
  }
  return value
}
