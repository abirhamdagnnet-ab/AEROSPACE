import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app.js'
import { createAdminAuthService } from '../src/services/adminAuthService.js'
import { slugify, validatePasswordChange, validatePostPayload } from '../src/validation/admin.js'

const servers = []
const categories = [
  { id: 10, slug: 'aviation', name: 'Aviation', description: 'Flight and aircraft.' },
  { id: 20, slug: 'space', name: 'Space', description: 'Orbit and discovery.' },
  { id: 30, slug: 'science', name: 'Science', description: 'Aerospace science.' },
]
const now = Date.now()
const adminPasswordHash = bcrypt.hashSync('Correct test password!', 4)
const posts = [
  {
    id: 1,
    slug: 'flight-forces',
    title: 'Understanding the forces of flight',
    excerpt: 'A clear look at the forces behind a flight.',
    content: 'Students explore lift and the forces behind flight.',
    category_id: 10,
    category_slug: 'aviation',
    category_name: 'Aviation',
    author_id: 1,
    author_name: 'AeroCampus Sample Author',
    status: 'published',
    published_at: new Date(now - 1_000),
    is_sample: true,
  },
  {
    id: 2,
    slug: 'satellite-orbits',
    title: 'How satellite orbits work',
    excerpt: 'A guide to orbits and satellites.',
    content: 'Learn how a satellite follows an orbit around Earth.',
    category_id: 20,
    category_slug: 'space',
    category_name: 'Space',
    author_id: 1,
    author_name: 'AeroCampus Sample Author',
    status: 'published',
    published_at: new Date(now - 2_000),
    is_sample: true,
  },
  {
    id: 3,
    slug: 'aviation-teamwork',
    title: 'Teamwork in aviation',
    excerpt: 'The people who support safe aviation.',
    content: 'Aviation depends on engineers and a coordinated team.',
    category_id: 10,
    category_slug: 'aviation',
    category_name: 'Aviation',
    author_id: 1,
    author_name: 'AeroCampus Sample Author',
    status: 'published',
    published_at: new Date(now - 3_000),
    is_sample: false,
  },
  {
    id: 4,
    slug: 'private-draft',
    title: 'Unpublished aerospace research',
    excerpt: 'This draft must stay private.',
    content: 'Editorial work in progress that is not ready for the public.',
    category_id: 20,
    category_slug: 'space',
    category_name: 'Space',
    author_id: 1,
    author_name: 'AeroCampus Sample Author',
    status: 'draft',
    published_at: null,
    is_sample: false,
  },
  {
    id: 5,
    slug: 'future-story',
    title: 'A scheduled future story',
    excerpt: 'This item is published later.',
    content: 'A public story scheduled for a future publication date.',
    category_id: 20,
    category_slug: 'space',
    category_name: 'Space',
    author_id: 1,
    author_name: 'AeroCampus Sample Author',
    status: 'published',
    published_at: new Date(now + 86_400_000),
    is_sample: false,
  },
]

function publicPost(post) {
  return post.status === 'published' && post.published_at && post.published_at <= new Date()
}

function createDatabase() {
  const queries = []
  const sessions = new Map()
  const database = {
    queries,
    async query(sql, values = []) {
      queries.push({ sql, values })
      if (sql.includes('SELECT c.id, c.name, c.slug')) {
        const visibleCategoryIds = new Set(posts.filter(publicPost).map((post) => post.category_id))
        return { rows: categories.filter((category) => visibleCategoryIds.has(category.id)) }
      }

      if (sql.includes('SELECT 1')) return { rows: [{ '?column?': 1 }] }
      if (sql.includes('FROM users') && sql.includes("role = 'admin'")) {
        return { rows: values[0] === 'admin@example.test' ? [{
          id: 42,
          name: 'Test Administrator',
          email: 'admin@example.test',
          password_hash: adminPasswordHash,
          role: 'admin',
        }] : [] }
      }
      if (sql.includes('INSERT INTO admin_sessions')) {
        sessions.set(values[1], { userId: values[0], expiresAt: new Date(values[2]) })
        return { rows: [] }
      }
      if (sql.includes('FROM admin_sessions s')) {
        const session = sessions.get(values[0])
        return { rows: session && session.expiresAt > new Date() ? [{
          id: session.userId,
          name: 'Test Administrator',
          email: 'admin@example.test',
          role: 'admin',
          expires_at: session.expiresAt,
        }] : [] }
      }
      if (sql.includes('DELETE FROM admin_sessions')) {
        sessions.delete(values[0])
        return { rows: [] }
      }

      if (sql.includes('COUNT(*)::int AS total_items')) {
        let filtered = posts.filter(publicPost)
        if (sql.includes('c.slug = $1')) {
          filtered = filtered.filter((post) => post.category_slug === values[0])
        }
        if (sql.includes('plainto_tsquery')) {
          const searchIndex = sql.includes('c.slug = $1') ? 1 : 0
          const search = values[searchIndex].toLowerCase()
          filtered = filtered.filter((post) =>
            [post.title, post.excerpt, post.content].some((text) => text.toLowerCase().includes(search)))
        }
        return { rows: [{ total_items: filtered.length }] }
      }

      if (sql.includes('ORDER BY p.published_at DESC')) {
        let filtered = posts.filter(publicPost)
        if (sql.includes('c.slug = $1')) {
          filtered = filtered.filter((post) => post.category_slug === values[0])
        }
        if (sql.includes('plainto_tsquery')) {
          const searchIndex = sql.includes('c.slug = $1') ? 1 : 0
          const search = values[searchIndex].toLowerCase()
          filtered = filtered.filter((post) =>
            [post.title, post.excerpt, post.content].some((text) => text.toLowerCase().includes(search)))
        }
        const limit = values.at(-2)
        const offset = values.at(-1)
        return { rows: filtered.sort((a, b) => b.published_at - a.published_at).slice(offset, offset + limit) }
      }

      if (sql.includes('WHERE p.slug = $1')) {
        const post = posts.find((item) => item.slug === values[0] && publicPost(item))
        return { rows: post ? [post] : [] }
      }

      if (sql.includes('INSERT INTO contact_messages')) {
        return { rows: [{ id: 88, created_at: new Date() }] }
      }

      throw new Error(`Unexpected SQL in test double: ${sql}`)
    },
  }
  return database
}

async function startApi({ database = createDatabase(), auth, admin, images } = {}) {
  const app = createApp({
    database,
    auth: auth || createAdminAuthService(database, 'test-session-secret'),
    admin,
    images,
  })
  const server = app.listen(0, '127.0.0.1')
  servers.push(server)
  await once(server, 'listening')
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, database }
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })))
})

test('GET /health reports a ready database and Helmet headers', async () => {
  const { baseUrl } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/health`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(body, { success: true, data: { status: 'ok' } })
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.match(response.headers.get('content-security-policy'), /default-src 'self'/)
})

test('unknown API routes return a generic error without reflecting request URLs', async () => {
  const { baseUrl } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/private-route?token=do-not-reflect`)
  const body = await response.json()

  assert.equal(response.status, 404)
  assert.deepEqual(body, {
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  })
  assert.equal(JSON.stringify(body).includes('do-not-reflect'), false)
})

test('unexpected server errors use a safe consistent response shape', async () => {
  const database = {
    async query() {
      const error = new Error('Sensitive SQL and connection details')
      error.code = 'XX000'
      error.detail = 'Private database detail'
      throw error
    },
  }
  const { baseUrl } = await startApi({ database })
  const response = await fetch(`${baseUrl}/api/v1/posts`)
  const body = await response.json()

  assert.equal(response.status, 500)
  assert.deepEqual(body, {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  })
})

test('GET /health reports unavailable database with 503', async () => {
  const database = { query: async () => { throw new Error('connection unavailable') } }
  const { baseUrl } = await startApi({ database })
  const response = await fetch(`${baseUrl}/api/v1/health`)
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.deepEqual(body.error, {
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database connection is unavailable.',
  })
})

test('admin login creates a secure HttpOnly cookie and /auth/me returns the administrator', async () => {
  const { baseUrl } = await startApi()
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const setCookie = loginResponse.headers.get('set-cookie')
  const cookie = setCookie.split(';')[0]

  assert.equal(loginResponse.status, 200)
  assert.equal(loginBody.data.user.role, 'admin')
  assert.ok(loginBody.data.csrfToken)
  assert.match(setCookie, /HttpOnly/i)
  assert.match(setCookie, /SameSite=Strict/i)
  assert.doesNotMatch(setCookie, /Secure/i)
  assert.equal(setCookie.includes('Correct test password!'), false)

  const currentResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { cookie },
  })
  const currentBody = await currentResponse.json()
  assert.equal(currentResponse.status, 200)
  assert.equal(currentBody.data.user.email, 'admin@example.test')
  assert.equal(currentBody.data.csrfToken, loginBody.data.csrfToken)
})

test('admin login rejects invalid credentials without issuing a cookie', async () => {
  const { baseUrl } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'wrong password' }),
  })
  const body = await response.json()

  assert.equal(response.status, 401)
  assert.deepEqual(body.error, { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' })
  assert.equal(response.headers.get('set-cookie'), null)
})

test('new administrator sessions must change the initial password before admin access', async () => {
  const token = 'test-admin-session-token-12345678901234567890'
  let mustChangePassword = true
  const auth = {
    async login() {
      return {
        token,
        csrfToken: 'test-csrf-token',
        user: {
          id: 42,
          name: 'Test Administrator',
          email: 'admin@example.test',
          role: 'admin',
          mustChangePassword,
        },
      }
    },
    async authenticate(candidate) {
      if (candidate !== token) return null
      return {
        token,
        tokenHash: 'test-token-hash',
        csrfToken: 'test-csrf-token',
        user: {
          id: 42,
          name: 'Test Administrator',
          email: 'admin@example.test',
          role: 'admin',
          mustChangePassword,
        },
      }
    },
    verifyCsrfToken: (candidate, csrf) => candidate === token && csrf === 'test-csrf-token',
    async changePassword({ currentPassword, newPassword }) {
      if (currentPassword !== 'Initial administrator password' || newPassword.length < 14) return false
      mustChangePassword = false
      return true
    },
    async logout() {},
  }
  const { baseUrl } = await startApi({ auth, admin: { dashboard: async () => ({ status: 'ready' }) } })
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Initial administrator password' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const restricted = await fetch(`${baseUrl}/api/v1/admin/dashboard`, { headers: { cookie } })

  assert.equal(loginBody.data.user.mustChangePassword, true)
  assert.equal(restricted.status, 403)
  assert.equal((await restricted.json()).error.code, 'PASSWORD_CHANGE_REQUIRED')

  const csrfDenied = await fetch(`${baseUrl}/api/v1/auth/password`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      currentPassword: 'Initial administrator password',
      newPassword: 'A new long administrator password',
    }),
  })
  assert.equal(csrfDenied.status, 403)

  const wrongPassword = await fetch(`${baseUrl}/api/v1/auth/password`, {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': loginBody.data.csrfToken,
    },
    body: JSON.stringify({
      currentPassword: 'Not the initial password',
      newPassword: 'A new long administrator password',
    }),
  })
  assert.equal(wrongPassword.status, 400)

  const changeResponse = await fetch(`${baseUrl}/api/v1/auth/password`, {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': loginBody.data.csrfToken,
    },
    body: JSON.stringify({
      currentPassword: 'Initial administrator password',
      newPassword: 'A new long administrator password',
    }),
  })
  assert.equal(changeResponse.status, 200)

  const dashboard = await fetch(`${baseUrl}/api/v1/admin/dashboard`, { headers: { cookie } })
  assert.equal(dashboard.status, 200)
})

test('admin logout revokes the session and clears its cookie', async () => {
  const { baseUrl } = await startApi()
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { cookie, 'x-csrf-token': loginBody.data.csrfToken },
  })
  const logoutBody = await logoutResponse.json()
  const currentResponse = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { cookie } })

  assert.equal(logoutResponse.status, 200)
  assert.equal(logoutBody.data.message, 'Signed out.')
  assert.match(logoutResponse.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i)
  assert.equal(currentResponse.status, 401)
})

test('admin endpoints reject unauthenticated requests and missing CSRF tokens', async () => {
  const { baseUrl } = await startApi()
  const unauthorized = await fetch(`${baseUrl}/api/v1/admin/dashboard`)
  assert.equal(unauthorized.status, 401)

  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const csrfDenied = await fetch(`${baseUrl}/api/v1/admin/categories`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Space', description: 'Space education category.' }),
  })
  const csrfBody = await csrfDenied.json()

  assert.equal(csrfDenied.status, 403)
  assert.equal(csrfBody.error.code, 'CSRF_INVALID')
})

test('admin endpoints reject an authenticated non-admin account', async () => {
  const auth = {
    async authenticate(token) {
      return token ? { user: { id: 9, role: 'author' } } : null
    },
    verifyCsrfToken: () => false,
  }
  const { baseUrl } = await startApi({ auth })
  const response = await fetch(`${baseUrl}/api/v1/admin/dashboard`, {
    headers: { cookie: 'aerocampus_admin=valid-session' },
  })

  assert.equal(response.status, 401)
  assert.equal((await response.json()).error.code, 'UNAUTHORIZED')
})

test('local upload endpoint requires admin authentication, CSRF, valid image bytes, and size limits', async () => {
  const { baseUrl } = await startApi()
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])

  const unauthenticatedForm = new FormData()
  unauthenticatedForm.append('image', new Blob([png], { type: 'image/png' }), 'cover.png')
  const unauthenticated = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    body: unauthenticatedForm,
  })
  assert.equal(unauthenticated.status, 401)

  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const headers = {
    cookie: loginResponse.headers.get('set-cookie').split(';')[0],
    'x-csrf-token': loginBody.data.csrfToken,
  }

  const csrfForm = new FormData()
  csrfForm.append('image', new Blob([png], { type: 'image/png' }), 'cover.png')
  const csrfDenied = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    headers: { cookie: headers.cookie },
    body: csrfForm,
  })
  assert.equal(csrfDenied.status, 403)

  const uploadForm = new FormData()
  uploadForm.append('image', new Blob([png], { type: 'image/png' }), 'cover.png')
  const success = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    headers,
    body: uploadForm,
  })
  const successBody = await success.json()
  assert.equal(success.status, 201)
  assert.match(successBody.data.url, /^\/api\/v1\/uploads\//)

  const wrongTypeForm = new FormData()
  wrongTypeForm.append('image', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'cover.svg')
  const wrongType = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    headers,
    body: wrongTypeForm,
  })
  assert.equal(wrongType.status, 400)
  assert.equal((await wrongType.json()).error.code, 'INVALID_IMAGE')

  const mismatchedForm = new FormData()
  mismatchedForm.append('image', new Blob([png], { type: 'image/jpeg' }), 'cover.jpg')
  const mismatched = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    headers,
    body: mismatchedForm,
  })
  assert.equal(mismatched.status, 400)

  const oversizedForm = new FormData()
  oversizedForm.append('image', new Blob([Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)])], { type: 'image/png' }), 'large.png')
  const oversized = await fetch(`${baseUrl}/api/v1/admin/uploads`, {
    method: 'POST',
    headers,
    body: oversizedForm,
  })
  assert.equal(oversized.status, 400)
})

test('cookie-authenticated write routes reject untrusted origins', async () => {
  const { baseUrl } = await startApi()
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://malicious.example',
    },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()

  assert.equal(loginResponse.status, 403)
  assert.equal(loginBody.error.code, 'ORIGIN_FORBIDDEN')
  assert.equal(loginResponse.headers.get('set-cookie'), null)
})

test('authorized write requests reject an untrusted origin before CSRF processing', async () => {
  const { baseUrl } = await startApi()
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const denied = await fetch(`${baseUrl}/api/v1/admin/categories`, {
    method: 'POST',
    headers: {
      cookie,
      origin: 'https://malicious.example',
      'content-type': 'application/json',
      'x-csrf-token': loginBody.data.csrfToken,
    },
    body: JSON.stringify({ name: 'Space', description: 'Space education category.' }),
  })
  const deniedBody = await denied.json()

  assert.equal(denied.status, 403)
  assert.equal(deniedBody.error.code, 'ORIGIN_FORBIDDEN')
})

test('login rate limit blocks the eleventh request in the window', async () => {
  const auth = {
    login: async () => null,
    authenticate: async () => null,
    logout: async () => {},
    verifyCsrfToken: () => false,
  }
  const { baseUrl } = await startApi({ auth })
  const statuses = []
  for (let attempt = 0; attempt < 11; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.test', password: 'not-the-password' }),
    })
    statuses.push(response.status)
  }

  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401))
  assert.equal(statuses[10], 429)
})

test('article payload generates a slug and rejects unsafe image URLs', () => {
  assert.equal(slugify('  Flight & Space: An Introduction!  '), 'flight-space-an-introduction')
  const payload = validatePostPayload({
    title: 'Flight & Space: An Introduction!',
    excerpt: 'A sufficiently long excerpt about flight and space.',
    content: 'This is a sufficiently long article body about aerospace learning.',
    categoryId: 10,
    status: 'draft',
    coverImageUrl: 'https://images.example.test/cover.jpg',
  })

  test('password change validation enforces new password requirements', () => {
    assert.deepEqual(validatePasswordChange({
      currentPassword: 'Initial administrator password',
      newPassword: 'A new long administrator password',
    }), {
      currentPassword: 'Initial administrator password',
      newPassword: 'A new long administrator password',
    })
    assert.throws(
      () => validatePasswordChange({
        currentPassword: 'Initial administrator password',
        newPassword: 'short',
      }),
      { code: 'VALIDATION_ERROR' }
    )
    assert.throws(
      () => validatePasswordChange({
        currentPassword: 'Initial administrator password',
        newPassword: 'A different password',
        unexpected: true,
      }),
      { code: 'VALIDATION_ERROR' }
    )
  })
  assert.equal(payload.slug, 'flight-space-an-introduction')

  assert.throws(
    () => validatePostPayload({
      title: 'Unsafe image example',
      excerpt: 'A sufficiently long excerpt about an unsafe image.',
      content: 'This is a sufficiently long article body about aerospace learning.',
      categoryId: 10,
      status: 'draft',
      coverImageUrl: 'javascript:alert(1)',
    }),
    { code: 'VALIDATION_ERROR' }
  )
  assert.throws(
    () => validatePostPayload({
      title: 'Insecure image example',
      excerpt: 'A sufficiently long excerpt about an insecure image.',
      content: 'This is a sufficiently long article body about aerospace learning.',
      categoryId: 10,
      status: 'draft',
      coverImageUrl: 'http://images.example.test/cover.jpg',
    }),
    { code: 'VALIDATION_ERROR' }
  )
})

test('authorized article creation is CSRF protected and records the acting admin', async () => {
  let createdPayload
  let authorId
  const admin = {
    createPost: async (payload, actorId) => {
      createdPayload = payload
      authorId = actorId
      return { id: 77 }
    },
    getPost: async (id) => ({ id, title: createdPayload.title, slug: createdPayload.slug, status: createdPayload.status }),
  }
  const { baseUrl } = await startApi({ admin })
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const response = await fetch(`${baseUrl}/api/v1/admin/posts`, {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': loginBody.data.csrfToken,
    },
    body: JSON.stringify({
      title: 'A new aerospace learning article',
      excerpt: 'An introductory article for curious aerospace students.',
      content: 'This article explains an aerospace subject in clear terms for learners.',
      categoryId: '20',
      status: 'published',
      coverImageUrl: '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000.jpg',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 201)
  assert.equal(body.data.id, 77)
  assert.equal(createdPayload.slug, 'a-new-aerospace-learning-article')
  assert.equal(createdPayload.categoryId, '20')
  assert.equal(authorId, 42)
})

test('administrator article workflow supports editing, publishing, and deleting', async () => {
  const article = { id: 77, title: 'Draft aerospace article', slug: 'draft-aerospace-article', status: 'draft' }
  const operations = []
  const admin = {
    updatePost: async (id, payload) => {
      operations.push({ operation: 'update', id, payload })
      Object.assign(article, payload)
    },
    getPost: async () => article,
    deletePost: async (id) => {
      operations.push({ operation: 'delete', id })
      return { id }
    },
  }
  const { baseUrl } = await startApi({ admin })
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const headers = {
    cookie,
    'content-type': 'application/json',
    'x-csrf-token': loginBody.data.csrfToken,
  }
  const updateResponse = await fetch(`${baseUrl}/api/v1/admin/posts/77`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Published aerospace article', status: 'published' }),
  })
  const updated = await updateResponse.json()
  const deleteResponse = await fetch(`${baseUrl}/api/v1/admin/posts/77`, {
    method: 'DELETE',
    headers,
  })
  const deleted = await deleteResponse.json()

  assert.equal(updateResponse.status, 200)
  assert.equal(updated.data.status, 'published')
  assert.equal(updated.data.slug, 'published-aerospace-article')
  assert.equal(deleteResponse.status, 200)
  assert.deepEqual(deleted.data, { id: '77', message: 'Article deleted.' })
  assert.deepEqual(operations.map(({ operation }) => operation), ['update', 'delete'])
})

test('administrator category routes support listing and CRUD with CSRF protection', async () => {
  const categoriesState = []
  const admin = {
    listCategories: async () => categoriesState,
    createCategory: async (category) => {
      const created = { id: 5, ...category }
      categoriesState.push(created)
      return created
    },
    updateCategory: async (id, category) => {
      const current = categoriesState.find((item) => item.id === Number(id))
      Object.assign(current, category)
      return current
    },
    deleteCategory: async (id) => {
      const index = categoriesState.findIndex((item) => item.id === Number(id))
      categoriesState.splice(index, 1)
    },
  }
  const { baseUrl } = await startApi({ admin })
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'Correct test password!' }),
  })
  const loginBody = await loginResponse.json()
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const headers = {
    cookie,
    'content-type': 'application/json',
    'x-csrf-token': loginBody.data.csrfToken,
  }
  const listResponse = await fetch(`${baseUrl}/api/v1/admin/categories`, { headers })
  const createResponse = await fetch(`${baseUrl}/api/v1/admin/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Space Science', description: 'Space education topics.' }),
  })
  const created = await createResponse.json()
  const updateResponse = await fetch(`${baseUrl}/api/v1/admin/categories/5`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ description: 'Updated space education topics.' }),
  })
  const updated = await updateResponse.json()
  const deleteResponse = await fetch(`${baseUrl}/api/v1/admin/categories/5`, {
    method: 'DELETE',
    headers,
  })

  assert.equal(listResponse.status, 200)
  assert.equal(createResponse.status, 201)
  assert.equal(created.data.slug, 'space-science')
  assert.equal(updateResponse.status, 200)
  assert.equal(updated.data.description, 'Updated space education topics.')
  assert.equal(deleteResponse.status, 200)
  assert.deepEqual(categoriesState, [])
})

test('GET /posts sorts newest first and paginates with metadata', async () => {
  const { baseUrl, database } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/posts?page=2&limit=1`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.length, 1)
  assert.equal(body.data[0].slug, 'satellite-orbits')
  assert.equal(body.data[0].is_sample, true)
  assert.equal(Object.hasOwn(body.data[0], 'password_hash'), false)
  assert.deepEqual(body.meta, { page: 2, limit: 1, totalItems: 3, totalPages: 3 })
  const postsQuery = database.queries.find(({ sql }) => sql.includes('ORDER BY p.published_at DESC'))
  assert.deepEqual(postsQuery.values, [1, 1])
  assert.match(postsQuery.sql, /ORDER BY p\.published_at DESC, p\.id DESC/)
})

test('GET /posts supports category and parameterized full-text search', async () => {
  const { baseUrl, database } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/posts?category=space&search=orbit`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(body.data.map((post) => post.slug), ['satellite-orbits'])
  assert.equal(body.meta.totalItems, 1)
  const postsQuery = database.queries.find(({ sql }) => sql.includes('ORDER BY p.published_at DESC'))
  assert.deepEqual(postsQuery.values, ['space', 'orbit', 9, 0])
  assert.match(postsQuery.sql, /plainto_tsquery\('simple', \$2\)/)
})

test('GET /posts keeps search text parameterized', async () => {
  const { baseUrl, database } = await startApi()
  const search = "' OR 1=1 --"
  const response = await fetch(`${baseUrl}/api/v1/posts?search=${encodeURIComponent(search)}`)
  const body = await response.json()
  const listQuery = database.queries.find(({ sql }) => sql.includes('ORDER BY p.published_at DESC'))

  assert.equal(response.status, 200)
  assert.equal(body.meta.totalItems, 0)
  assert.equal(listQuery.values[0], search)
  assert.equal(listQuery.sql.includes(search), false)
})

test('GET /posts/:slug returns published article details and hides drafts', async () => {
  const { baseUrl, database } = await startApi()
  const publicResponse = await fetch(`${baseUrl}/api/v1/posts/flight-forces`)
  const publicBody = await publicResponse.json()
  const draftResponse = await fetch(`${baseUrl}/api/v1/posts/private-draft`)
  const draftBody = await draftResponse.json()

  assert.equal(publicResponse.status, 200)
  assert.equal(publicBody.data.slug, 'flight-forces')
  assert.equal(draftResponse.status, 404)
  assert.deepEqual(draftBody.error, { code: 'NOT_FOUND', message: 'Article not found.' })
  const detailQuery = database.queries.filter(({ sql }) => sql.includes('WHERE p.slug = $1')).at(-1)
  assert.deepEqual(detailQuery.values, ['private-draft'])
  assert.match(detailQuery.sql, /p\.status = 'published'/)
})

test('public post list excludes drafts and future publications', async () => {
  const { baseUrl, database } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/posts`)
  const body = await response.json()
  const slugs = body.data.map((post) => post.slug)

  assert.equal(response.status, 200)
  assert.equal(body.meta.totalItems, 3)
  assert.equal(slugs.includes('private-draft'), false)
  assert.equal(slugs.includes('future-story'), false)
  const listQuery = database.queries.find(({ sql }) => sql.includes('ORDER BY p.published_at DESC'))
  assert.match(listQuery.sql, /p\.status = 'published'/)
  assert.match(listQuery.sql, /p\.published_at <= NOW\(\)/)
})

test('GET /posts rejects invalid pagination parameters', async () => {
  const { baseUrl } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/posts?page=0&limit=101`)
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.equal(body.error.details.length, 2)
})

test('GET /categories returns only categories represented by published posts', async () => {
  const { baseUrl } = await startApi()
  const response = await fetch(`${baseUrl}/api/v1/categories`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(body.data.map((category) => category.slug), ['aviation', 'space'])
})

test('POST /contact validates required fields and normalizes email', async () => {
  let database
  const started = await startApi()
  const { baseUrl } = started
  database = started.database
  const invalidResponse = await fetch(`${baseUrl}/api/v1/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'invalid', message: 'short' }),
  })
  const invalidBody = await invalidResponse.json()
  assert.equal(invalidResponse.status, 400)
  assert.equal(invalidBody.error.code, 'VALIDATION_ERROR')
  assert.equal(invalidBody.error.details.length, 3)
  assert.equal(database.queries.some(({ sql }) => sql.includes('INSERT INTO contact_messages')), false)

  const response = await fetch(`${baseUrl}/api/v1/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'TEST@example.com',
      subject: 'Story idea',
      message: 'I would like to suggest an aerospace story.',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 201)
  assert.equal(body.data.id, 88)
  const insert = database.queries.find(({ sql }) => sql.includes('INSERT INTO contact_messages'))
  assert.deepEqual(insert.values, [
    'Test User',
    'test@example.com',
    'Story idea',
    'I would like to suggest an aerospace story.',
  ])
})

test('POST /contact rate-limits repeated submissions', async () => {
  const { baseUrl } = await startApi()
  const statuses = []
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/v1/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'AeroCampus visitor',
        email: 'visitor@example.test',
        subject: 'Question',
        message: 'I would like to learn more about aerospace education.',
      }),
    })
    statuses.push(response.status)
  }

  assert.deepEqual(statuses.slice(0, 5), Array(5).fill(201))
  assert.equal(statuses[5], 429)
})
