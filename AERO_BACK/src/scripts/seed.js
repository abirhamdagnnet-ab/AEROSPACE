import 'dotenv/config'
import { pool, safeDatabaseErrorMessage } from '../config/db.js'

const categories = [
  {
    name: 'Aviation',
    slug: 'aviation',
    description: 'Aircraft, flight, and the people who make aviation possible.',
  },
  {
    name: 'Space',
    slug: 'space',
    description: 'Satellites, spacecraft, and discovery beyond Earth.',
  },
  {
    name: 'Science',
    slug: 'science',
    description: 'The scientific ideas behind aerospace.',
  },
  {
    name: 'Careers',
    slug: 'careers',
    description: 'Learning about aerospace roles and career pathways.',
  },
]

const samplePosts = [
  {
    title: 'Inside the World of Flight',
    slug: 'inside-the-world-of-flight',
    excerpt: 'A student-friendly introduction to the four forces that help an aircraft take to the sky.',
    content: 'SAMPLE ARTICLE: Flight is the result of careful design and a balance of forces. Lift acts upward while weight pulls downward. Thrust moves an aircraft forward and drag resists that motion. Pilots, engineers, and maintenance teams work together to keep aircraft operating safely. These ideas connect classroom physics to the aircraft we see every day.',
    category: 'aviation',
    coverImageUrl: 'asset:aviation',
  },
  {
    title: 'Satellites That Connect Us',
    slug: 'satellites-that-connect-us',
    excerpt: 'Discover the orbital technology behind communications, navigation, and weather reports.',
    content: 'SAMPLE ARTICLE: Satellites support many everyday services from high above Earth. Their missions include relaying communications, helping with navigation, and observing weather and climate. Each satellite follows an orbit suited to its task. Understanding how these systems work brings together physics, mathematics, computing, and collaboration.',
    category: 'space',
    coverImageUrl: 'asset:space',
  },
  {
    title: 'Skills for Your First Aerospace Project',
    slug: 'skills-for-your-first-aerospace-project',
    excerpt: 'Build confidence with practical ideas for exploring aerospace in and beyond the classroom.',
    content: 'SAMPLE ARTICLE: Curiosity is a useful starting point for learning about aerospace. Try a small project: compare paper aircraft designs, write a simple program, or keep a journal of aircraft you observe. Mathematics and science provide useful foundations, while communication and teamwork help bring ideas to life. Ask questions and look for opportunities to learn with others.',
    category: 'careers',
    coverImageUrl: 'asset:careers',
  },
  {
    title: 'Why Aircraft Wings Are Shaped That Way',
    slug: 'why-aircraft-wings-are-shaped-that-way',
    excerpt: 'Wing design balances lift, efficiency, strength, and control throughout a flight.',
    content: 'SAMPLE ARTICLE: Aircraft wings are shaped to generate lift efficiently across changing conditions. The cross-section, span, and angle all influence how air moves around them. Designers balance efficiency, strength, speed, and the needs of a particular aircraft. Movable surfaces such as flaps help pilots adapt the wing during takeoff and landing.',
    category: 'science',
    coverImageUrl: 'asset:science',
  },
]

async function seed() {
  if (!pool) throw new Error('DATABASE_URL is required. Configure it in AERO_BACK/.env.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const categoryIds = new Map()

    for (const category of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id`,
        [category.name, category.slug, category.description]
      )
      categoryIds.set(category.slug, rows[0].id)
    }

    const authorResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'author')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['AeroCampus Sample Author', 'sample.author@aerocampus.org', 'SAMPLE_ONLY_NO_LOGIN']
    )
    const authorId = authorResult.rows[0].id

    for (const [index, post] of samplePosts.entries()) {
      await client.query(
        `INSERT INTO posts
           (title, slug, excerpt, content, cover_image_url, author_id, category_id,
            status, published_at, is_sample)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', NOW() - ($8::int * INTERVAL '1 day'), TRUE)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           excerpt = EXCLUDED.excerpt,
           content = EXCLUDED.content,
           cover_image_url = EXCLUDED.cover_image_url,
           author_id = EXCLUDED.author_id,
           category_id = EXCLUDED.category_id,
           status = EXCLUDED.status,
           published_at = EXCLUDED.published_at,
           is_sample = TRUE`,
        [
          post.title,
          post.slug,
          post.excerpt,
          post.content,
          post.coverImageUrl,
          authorId,
          categoryIds.get(post.category),
          index,
        ]
      )
    }

    await client.query('COMMIT')
    console.log(`Seeded ${categories.length} categories and ${samplePosts.length} clearly labelled sample posts.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

try {
  await seed()
} catch (error) {
  console.error('Unable to seed AeroCampus sample data:', safeDatabaseErrorMessage(error))
  process.exitCode = 1
} finally {
  await pool?.end()
}
