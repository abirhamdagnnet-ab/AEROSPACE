export function createAdminRepository(database) {
  return {
    async dashboard() {
      const [counts, categoryCount, messageCount, recent] = await Promise.all([
        database.query(
          `SELECT COUNT(*)::int AS total_articles,
                  COUNT(*) FILTER (WHERE status = 'published')::int AS published_articles,
                  COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_articles
           FROM posts`
        ),
        database.query('SELECT COUNT(*)::int AS total_categories FROM categories'),
        database.query('SELECT COUNT(*)::int AS total_messages FROM contact_messages'),
        database.query(
          `SELECT p.id, p.title, p.slug, p.status, p.updated_at, p.published_at,
                  c.name AS category_name, u.name AS author_name
           FROM posts p
           JOIN categories c ON c.id = p.category_id
           JOIN users u ON u.id = p.author_id
           ORDER BY p.updated_at DESC, p.id DESC
           LIMIT 6`
        ),
      ])
      return {
        ...counts.rows[0],
        ...categoryCount.rows[0],
        ...messageCount.rows[0],
        recentArticles: recent.rows,
      }
    },

    async listPosts({ page, limit, search, status, categoryId }) {
      const conditions = []
      const values = []
      if (status) {
        values.push(status)
        conditions.push(`p.status = $${values.length}`)
      }
      if (categoryId) {
        values.push(categoryId)
        conditions.push(`p.category_id = $${values.length}`)
      }
      if (search) {
        values.push(search)
        const placeholder = `$${values.length}`
        conditions.push(`(
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.slug, ''))
          @@ plainto_tsquery('simple', ${placeholder})
        )`)
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const counts = await database.query(
        `SELECT COUNT(*)::int AS total_items
         FROM posts p ${where}`,
        values
      )
      const pageValues = [...values, limit, (page - 1) * limit]
      const result = await database.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image_url,
                p.author_id, u.name AS author_name, p.category_id,
                c.name AS category_name, p.status, p.published_at,
                p.created_at, p.updated_at, p.is_sample
         FROM posts p
         JOIN users u ON u.id = p.author_id
         JOIN categories c ON c.id = p.category_id
         ${where}
         ORDER BY p.updated_at DESC, p.id DESC
         LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
        pageValues
      )
      return {
        posts: result.rows,
        page,
        limit,
        totalItems: counts.rows[0].total_items,
        totalPages: Math.ceil(counts.rows[0].total_items / limit),
      }
    },

    async getPostById(id) {
      const { rows } = await database.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image_url,
                p.author_id, u.name AS author_name, p.category_id,
                c.name AS category_name, p.status, p.published_at,
                p.created_at, p.updated_at, p.is_sample
         FROM posts p
         JOIN users u ON u.id = p.author_id
         JOIN categories c ON c.id = p.category_id
         WHERE p.id = $1 LIMIT 1`,
        [id]
      )
      return rows[0] || null
    },

    async createPost({ payload, authorId }) {
      const client = await database.connect()
      try {
        await client.query('BEGIN')
        const slug = await findAvailableSlug(client, payload.slug)
        const { rows } = await client.query(
          `INSERT INTO posts
             (title, slug, excerpt, content, cover_image_url,
              author_id, category_id, status, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
             CASE WHEN $8 = 'published' THEN NOW() ELSE NULL END)
           RETURNING id`,
          [
            payload.title,
            slug,
            payload.excerpt,
            payload.content,
            payload.coverImageUrl,
            authorId,
            payload.categoryId,
            payload.status,
          ]
        )
        await client.query('COMMIT')
        return rows[0]
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },

    async updatePost(id, payload) {
      const assignments = []
      const values = []
      const allowed = {
        title: 'title',
        slug: 'slug',
        excerpt: 'excerpt',
        content: 'content',
        coverImageUrl: 'cover_image_url',
        categoryId: 'category_id',
        status: 'status',
      }
      for (const [field, column] of Object.entries(allowed)) {
        if (payload[field] === undefined) continue
        values.push(payload[field])
        assignments.push(`${column} = $${values.length}`)
      }
      if (payload.status === 'draft') assignments.push('published_at = NULL')
      if (payload.status === 'published') assignments.push("published_at = COALESCE(published_at, NOW())")
      if (assignments.length === 0) return this.getPostById(id)

      values.push(id)
      const { rows } = await database.query(
        `UPDATE posts SET ${assignments.join(', ')}
         WHERE id = $${values.length}
         RETURNING id`,
        values
      )
      return rows[0] || null
    },

    async deletePost(id) {
      const { rows } = await database.query(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [id]
      )
      return rows[0] || null
    },

    async listContactMessages({ page, limit }) {
      const counts = await database.query('SELECT COUNT(*)::int AS total_items FROM contact_messages')
      const { rows } = await database.query(
        `SELECT id, name, email, subject, message, created_at
         FROM contact_messages
         ORDER BY created_at DESC, id DESC
         LIMIT $1 OFFSET $2`,
        [limit, (page - 1) * limit]
      )
      const totalItems = counts.rows[0].total_items
      return { messages: rows, page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
    },

    async deleteContactMessage(id) {
      const { rows } = await database.query(
        'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
        [id]
      )
      return rows[0] || null
    },

    async listCategories() {
      const { rows } = await database.query(
        `SELECT c.id, c.name, c.slug, c.description, c.created_at,
                COUNT(p.id)::int AS article_count
         FROM categories c
         LEFT JOIN posts p ON p.category_id = c.id
         GROUP BY c.id
         ORDER BY c.name`
      )
      return rows
    },

    async createCategory(payload) {
      const slug = await findAvailableSlug(database, payload.slug, 'categories', 'slug', 80)
      const { rows } = await database.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, slug, description, created_at`,
        [payload.name, slug, payload.description]
      )
      return rows[0]
    },

    async updateCategory(id, payload) {
      const assignments = []
      const values = []
      for (const [field, column] of [['name', 'name'], ['slug', 'slug'], ['description', 'description']]) {
        if (payload[field] === undefined) continue
        values.push(payload[field])
        assignments.push(`${column} = $${values.length}`)
      }
      if (!assignments.length) {
        const { rows } = await database.query(
          'SELECT id, name, slug, description, created_at FROM categories WHERE id = $1',
          [id]
        )
        return rows[0] || null
      }
      values.push(id)
      const { rows } = await database.query(
        `UPDATE categories SET ${assignments.join(', ')}
         WHERE id = $${values.length}
         RETURNING id, name, slug, description, created_at`,
        values
      )
      return rows[0] || null
    },

    async deleteCategory(id) {
      const { rows } = await database.query(
        `DELETE FROM categories c
         WHERE c.id = $1
           AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.category_id = c.id)
         RETURNING c.id`,
        [id]
      )
      if (rows[0]) return { deleted: true, inUse: false }
      const exists = await database.query('SELECT 1 FROM categories WHERE id = $1', [id])
      return exists.rows.length
        ? { deleted: false, inUse: true }
        : { deleted: false, inUse: false }
    },
  }
}

async function findAvailableSlug(database, baseSlug, table = 'posts', column = 'slug', maxLength = 200) {
  if (!['posts', 'categories'].includes(table) || column !== 'slug') {
    throw new Error('Unsupported slug lookup target.')
  }
  for (let suffix = 1; suffix <= 1000; suffix += 1) {
    const suffixText = suffix === 1 ? '' : `-${suffix}`
    const candidate = `${baseSlug.slice(0, maxLength - suffixText.length).replace(/-+$/g, '')}${suffixText}`
    const { rows } = await database.query(
      `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
      [candidate]
    )
    if (!rows.length) return candidate
  }
  throw new Error('Could not allocate a unique slug.')
}
