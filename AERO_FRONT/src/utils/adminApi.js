let csrfToken = ''
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')

export function setCsrfToken(token) {
  csrfToken = token || ''
}

export function adminUpload(path, file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)
    request.withCredentials = true
    request.timeout = 120000
    request.setRequestHeader('Accept', 'application/json')
    if (csrfToken) request.setRequestHeader('X-CSRF-Token', csrfToken)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      let result
      try {
        result = JSON.parse(request.responseText)
      } catch {
        reject(new Error('The API returned an unreadable response.'))
        return
      }
      if (request.status < 200 || request.status >= 300) {
        const error = new Error(result.error?.message || 'The image upload could not be completed.')
        error.status = request.status
        error.code = result.error?.code
        error.details = result.error?.details
        reject(error)
        return
      }
      if (result.data?.csrfToken) setCsrfToken(result.data.csrfToken)
      resolve(result)
    })
    request.addEventListener('error', () => reject(new Error('Unable to reach the AeroCampus API. Check your connection and try again.')))
    request.addEventListener('timeout', () => reject(new Error('Image upload timed out. Please try again.')))
    request.addEventListener('abort', () => reject(new Error('Image upload was cancelled.')))
    const body = new FormData()
    body.append('image', file)
    request.send(body)
  })
}

export async function adminRequest(path, { method = 'GET', body, csrf = false } = {}) {
  const headers = { Accept: 'application/json' }
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (csrf && csrfToken) headers['X-CSRF-Token'] = csrfToken

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new Error('Unable to reach the AeroCampus API. Check that the backend is running.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The API returned an unreadable response.')
  }

  if (!response.ok) {
    const message = result.error?.message || 'The request could not be completed.'
    const details = Array.isArray(result.error?.details)
      ? result.error.details
        .map((detail) => detail?.message ? `${detail.field ? `${detail.field}: ` : ''}${detail.message}` : '')
        .filter(Boolean)
        .join(' ')
      : ''
    const error = new Error(details ? `${message} ${details}` : message)
    error.status = response.status
    error.code = result.error?.code
    error.details = result.error?.details
    throw error
  }

  if (result.data?.csrfToken) setCsrfToken(result.data.csrfToken)
  return result
}
