export function createAdminAuthRepository(database) {
  return {
    async findAdminByEmail(email) {
      const { rows } = await database.query(
        `SELECT id, name, email, password_hash, role, must_change_password
         FROM users
         WHERE email = $1 AND role = 'admin'
         LIMIT 1`,
        [email]
      )
      return rows[0] || null
    },

    async createSession({ userId, tokenHash, expiresAt }) {
      await database.query(
        `INSERT INTO admin_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
      )
    },

    async findSession(tokenHash) {
      const { rows } = await database.query(
        `SELECT u.id, u.name, u.email, u.role, u.must_change_password, s.expires_at
         FROM admin_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.role = 'admin'
         LIMIT 1`,
        [tokenHash]
      )
      return rows[0] || null
    },

    async deleteSession(tokenHash) {
      await database.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash])
    },

    async findAdminById(id) {
      const { rows } = await database.query(
        `SELECT id, password_hash, must_change_password
         FROM users
         WHERE id = $1 AND role = 'admin'
         LIMIT 1`,
        [id]
      )
      return rows[0] || null
    },

    async changeAdminPassword({ userId, tokenHash, passwordHash }) {
      const client = await database.connect()
      try {
        await client.query('BEGIN')
        const { rows } = await client.query(
          `UPDATE users
           SET password_hash = $1, must_change_password = FALSE
           WHERE id = $2 AND role = 'admin'
           RETURNING id`,
          [passwordHash, userId]
        )
        if (!rows.length) {
          await client.query('ROLLBACK')
          return false
        }
        await client.query(
          'DELETE FROM admin_sessions WHERE user_id = $1 AND token_hash <> $2',
          [userId, tokenHash]
        )
        await client.query('COMMIT')
        return true
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },
  }
}
