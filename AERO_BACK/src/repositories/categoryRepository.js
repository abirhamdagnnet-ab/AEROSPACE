export function createCategoryRepository(database) {
  return {
    async list() {
      const { rows } = await database.query(
        `SELECT c.id, c.name, c.slug, c.description, c.created_at
         FROM categories c
         WHERE EXISTS (
           SELECT 1
           FROM posts p
           WHERE p.category_id = c.id
             AND p.status = 'published'
             AND p.published_at IS NOT NULL
             AND p.published_at <= NOW()
         )
         ORDER BY c.name ASC`
      )
      return rows
    },
  }
}
