import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createAdminAuthRepository } from '../repositories/adminAuthRepository.js'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12)

export function createAdminAuthService(database, secret = process.env.SESSION_SECRET) {
  const repository = createAdminAuthRepository(database)
  const csrfSecret = secret || randomBytes(32).toString('hex')

  return {
    async login({ email, password }) {
      const user = await repository.findAdminByEmail(email)
      const matches = await bcrypt.compare(password, user?.password_hash || dummyHash)
      if (!user || !matches) return null

      const token = randomBytes(32).toString('base64url')
      const tokenHash = createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
      await repository.createSession({ userId: user.id, tokenHash, expiresAt })
      return {
        token,
        csrfToken: this.createCsrfToken(token),
        expiresAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password === true,
        },
      }
    },

    async authenticate(token) {
      if (typeof token !== 'string' || token.length < 40 || token.length > 100) return null
      const tokenHash = createHash('sha256').update(token).digest('hex')
      const user = await repository.findSession(tokenHash)
      if (!user) return null
      return {
        token,
        tokenHash,
        csrfToken: this.createCsrfToken(token),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password === true,
        },
      }
    },

    async changePassword({ userId, tokenHash, currentPassword, newPassword }) {
      const user = await repository.findAdminById(userId)
      if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        return false
      }
      if (await bcrypt.compare(newPassword, user.password_hash)) {
        return false
      }
      const passwordHash = await bcrypt.hash(newPassword, 12)
      return repository.changeAdminPassword({ userId, tokenHash, passwordHash })
    },

    async logout(tokenHash) {
      if (tokenHash) await repository.deleteSession(tokenHash)
    },

    createCsrfToken(token) {
      return createHmac('sha256', csrfSecret).update(token).digest('base64url')
    },

    verifyCsrfToken(token, candidate) {
      if (typeof candidate !== 'string') return false
      const expected = Buffer.from(this.createCsrfToken(token))
      const actual = Buffer.from(candidate)
      return expected.length === actual.length && timingSafeEqual(expected, actual)
    },
  }
}
