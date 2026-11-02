import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createPool, pool, safeDatabaseErrorMessage } from '../config/db.js'

const migrationsDirectory = fileURLToPath(new URL('../../migrations/', import.meta.url))
const migrationUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL
const migrationPool = migrationUrl
  ? createPool({ connectionString: migrationUrl })
  : null

async function migrate() {
  if (!migrationPool) throw new Error('DATABASE_URL is required. Configure it in AERO_BACK/.env.')
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'true') {
    throw new Error('DATABASE_SSL=true is required for production migrations.')
  }
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_MIGRATION_URL) {
    throw new Error('DATABASE_MIGRATION_URL is required to run production migrations.')
  }

  await migrationPool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/.test(name))
    .sort()

  const client = await migrationPool.connect()
  try {
    for (const name of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [name]
      )
      if (rows.length > 0) {
        console.log(`Already applied: ${name}`)
        continue
      }

      const sql = await readFile(path.join(migrationsDirectory, name), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
        await client.query('COMMIT')
        console.log(`Applied: ${name}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
    console.log('Database migrations are up to date.')
  } finally {
    client.release()
  }
}

try {
  await migrate()
} catch (error) {
  console.error('Migration failed:', safeDatabaseErrorMessage(error))
  process.exitCode = 1
} finally {
  await migrationPool?.end()
  await pool?.end()
}
