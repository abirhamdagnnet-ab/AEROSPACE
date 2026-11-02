export function createContactRepository(database) {
  return {
    async create({ name, email, subject, message }) {
      const { rows } = await database.query(
        `INSERT INTO contact_messages (name, email, subject, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at`,
        [name, email, subject, message]
      )
      return rows[0]
    },
  }
}
