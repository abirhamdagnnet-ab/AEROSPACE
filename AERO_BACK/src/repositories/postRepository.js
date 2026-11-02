export function createPostRepository(database) {
  return {
    async list({ page, limit, search, category }) {
      const conditions = [
        "p.status = 'published'",
        'p.published_at IS NOT NULL',
        'p.published_at <= NOW()',
      ]
      const values = []

      if (category) {
        values.push(category)
        conditions.push(`c.slug = $${values.length}`)
      }
      if (search) {
        values.push(search)
        const parameter = `$${values.length}`
        conditions.push(`to_tsvector(
          'simple',
          coalesce(p.title, '') || ' ' || coalesce(p.excerpt, '') || ' ' || coalesce(p.content, '')
        ) @@ plainto_tsquery('simple', ${parameter})`)
      }

      const whereClause = conditions.join(' AND ')
      const countResult = await database.query(
        `SELECT COUNT(*)::int AS total_items
         FROM posts p
         JOIN categories c ON c.id = p.category_id
         WHERE ${whereClause}`,
        values
      )
      const totalItems = countResult.rows[0].total_items
      const pageValues = [...values, limit, (page - 1) * limit]
      const postsResult = await database.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image_url,
                p.category_id, c.name AS category_name, c.slug AS category_slug,
                p.author_id, u.name AS author_name, p.published_at,
                p.created_at, p.updated_at, p.is_sample
         FROM posts p
         JOIN categories c ON c.id = p.category_id
         JOIN users u ON u.id = p.author_id
         WHERE ${whereClause}
         ORDER BY p.published_at DESC, p.id DESC
         LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
        pageValues
      )

      return {
        posts: postsResult.rows,
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      }
    },

    async getBySlug(slug) {
      const result = await database.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image_url,
                p.category_id, c.name AS category_name, c.slug AS category_slug,
                c.description AS category_description,
                p.author_id, u.name AS author_name, p.status, p.published_at,
                p.created_at, p.updated_at, p.is_sample
         FROM posts p
         JOIN categories c ON c.id = p.category_id
         JOIN users u ON u.id = p.author_id
         WHERE p.slug = $1
           AND p.status = 'published'
           AND p.published_at IS NOT NULL
           AND p.published_at <= NOW()
         LIMIT 1`,
        [slug]
      )
      return result.rows[0] || null
    },
  }
}
