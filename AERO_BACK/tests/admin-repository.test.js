import assert from 'node:assert/strict'
import { test } from 'node:test'
import bcrypt from 'bcryptjs'
import { createAdminRepository } from '../src/repositories/adminRepository.js'
import { createAdminAuthService } from '../src/services/adminAuthService.js'
import { createAdminService } from '../src/services/adminService.js'

test('post creation allocates a unique numbered slug without interpolating data', async () => {
  const calls = []
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values })
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] }
      if (sql.includes('SELECT 1 FROM posts')) {
        return { rows: values[0] === 'flight-study' ? [{}] : [] }
      }
      if (sql.includes('INSERT INTO posts')) return { rows: [{ id: 19 }] }
      throw new Error(`Unexpected query: ${sql}`)
    },
    release() {},
  }
  const repository = createAdminRepository({
    connect: async () => client,
  })
  const result = await repository.createPost({
    authorId: 7,
    payload: {
      title: 'Flight study',
      slug: 'flight-study',
      excerpt: 'A long enough excerpt about an introductory flight study.',
      content: 'This article is long enough to pass validation and explains a subject.',
      coverImageUrl: '',
      categoryId: '3',
      status: 'draft',
    },
  })
  const insert = calls.find(({ sql }) => sql.includes('INSERT INTO posts'))

  assert.equal(result.id, 19)
  assert.equal(calls.some(({ values }) => values.includes('flight-study-2')), true)
  assert.equal(insert.values[1], 'flight-study-2')
  assert.equal(insert.values[5], 7)
  assert.match(insert.sql, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8/)
})

test('category deletion reports a conflict when any post references it', async () => {
  const database = {
    async query(sql) {
      if (sql.startsWith('DELETE FROM categories')) return { rows: [] }
      if (sql.includes('SELECT 1 FROM categories')) return { rows: [{}] }
      throw new Error(`Unexpected query: ${sql}`)
    },
  }
  const service = createAdminService(database)

  await assert.rejects(
    service.deleteCategory('4'),
    (error) => error.statusCode === 409 && error.code === 'CATEGORY_IN_USE'
  )
})

test('publishing and unpublishing set the publication timestamp safely', async () => {
  const updates = []
  const database = {
    async query(sql, values) {
      updates.push({ sql, values })
      return { rows: [{ id: values.at(-1) }] }
    },
  }
  const repository = createAdminRepository(database)

  await repository.updatePost('12', { status: 'published' })
  await repository.updatePost('12', { status: 'draft' })

  assert.match(updates[0].sql, /published_at = COALESCE\(published_at, NOW\(\)\)/)
  assert.match(updates[1].sql, /published_at = NULL/)
  assert.deepEqual(updates.map(({ values }) => values), [['published', '12'], ['draft', '12']])
})

test('article image replacement keeps local image references without external cleanup', async () => {
  const database = {
    async query(sql) {
      if (sql.startsWith('DELETE FROM posts')) return { rows: [{ id: '4' }] }
      if (sql.includes('WHERE p.id = $1')) return { rows: [{ id: '4' }] }
      if (sql.startsWith('UPDATE posts SET')) return { rows: [{ id: '4' }] }
      throw new Error(`Unexpected query: ${sql}`)
    },
  }
  const service = createAdminService(database)

  await service.updatePost('4', {
    coverImageUrl: '/api/v1/uploads/new.png',
  })
  await service.deletePost('4')
})

test('new administrator password change updates the hash and keeps only the current session', async () => {
  const user = {
    id: 8,
    name: 'Test Administrator',
    email: 'admin@example.test',
    role: 'admin',
    password_hash: bcrypt.hashSync('Initial administrator password', 4),
    must_change_password: true,
  }
  const sessions = new Map()
  const queries = []
  const database = {
    async query(sql, values = []) {
      queries.push({ sql, values })
      if (sql.includes('WHERE email = $1')) return { rows: [user] }
      if (sql.includes('INSERT INTO admin_sessions')) {
        sessions.set(values[1], { userId: values[0], expiresAt: new Date(values[2]) })
        return { rows: [] }
      }
      if (sql.includes('FROM admin_sessions s')) {
        const session = sessions.get(values[0])
        return {
          rows: session ? [{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            must_change_password: user.must_change_password,
            expires_at: session.expiresAt,
          }] : [],
        }
      }
      if (sql.includes('WHERE id = $1 AND role')) return { rows: [user] }
      throw new Error(`Unexpected query: ${sql}`)
    },
    async connect() {
      return {
        async query(sql, values = []) {
          queries.push({ sql, values })
          if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] }
          if (sql.includes('UPDATE users')) {
            user.password_hash = values[0]
            user.must_change_password = false
            return { rows: [{ id: user.id }] }
          }
          if (sql.includes('DELETE FROM admin_sessions')) {
            for (const [hash, session] of sessions) {
              if (session.userId === values[0] && hash !== values[1]) sessions.delete(hash)
            }
            return { rows: [] }
          }
          throw new Error(`Unexpected query: ${sql}`)
        },
        release() {},
      }
    },
  }
  const auth = createAdminAuthService(database, 'test-session-secret')
  const login = await auth.login({
    email: user.email,
    password: 'Initial administrator password',
  })
  const session = await auth.authenticate(login.token)

  assert.equal(login.user.mustChangePassword, true)
  sessions.set('other-session', { userId: user.id, expiresAt: new Date(Date.now() + 60_000) })
  assert.equal(await auth.changePassword({
    userId: user.id,
    tokenHash: session.tokenHash,
    currentPassword: 'wrong password',
    newPassword: 'A new long administrator password',
  }), false)

  const changed = await auth.changePassword({
    userId: user.id,
    tokenHash: session.tokenHash,
    currentPassword: 'Initial administrator password',
    newPassword: 'A new long administrator password',
  })
  assert.equal(changed, true)
  assert.equal(user.must_change_password, false)
  assert.equal(await bcrypt.compare('A new long administrator password', user.password_hash), true)
  assert.equal((await auth.authenticate(login.token)).user.mustChangePassword, false)
  assert.equal(sessions.has('other-session'), false)
  assert.equal(queries.some(({ sql }) => sql.includes('token_hash <> $2')), true)
})

test('new administrator password change rejects reuse of the initial password', async () => {
  const passwordHash = bcrypt.hashSync('Initial administrator password', 4)
  let updateCount = 0
  const database = {
    async query(sql) {
      if (sql.includes('WHERE id = $1 AND role')) {
        return { rows: [{ id: 8, password_hash: passwordHash, must_change_password: true }] }
      }
      throw new Error(`Unexpected query: ${sql}`)
    },
    async connect() {
      return {
        async query(sql) {
          if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] }
          if (sql.includes('UPDATE users')) {
            updateCount += 1
            return { rows: [{ id: 8 }] }
          }
          throw new Error(`Unexpected query: ${sql}`)
        },
        release() {},
      }
    },
  }
  const auth = createAdminAuthService(database, 'test-session-secret')

  assert.equal(await auth.changePassword({
    userId: 8,
    tokenHash: 'session-hash',
    currentPassword: 'Initial administrator password',
    newPassword: 'Initial administrator password',
  }), false)
  assert.equal(updateCount, 0)
})
