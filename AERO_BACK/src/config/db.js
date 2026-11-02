import pg from 'pg'

const { Pool } = pg

export function createPool({
  connectionString = process.env.DATABASE_URL,
  ssl,
} = {}) {
  if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new Error('A valid PostgreSQL connection URL is required.')
  }
  if (process.env.DATABASE_SSL !== undefined && !['true', 'false'].includes(process.env.DATABASE_SSL)) {
    throw new Error('DATABASE_SSL must be true or false.')
  }
  const tlsEnabled = ssl === undefined ? process.env.DATABASE_SSL === 'true' : ssl
  if (typeof tlsEnabled !== 'boolean') {
    throw new Error('DATABASE_SSL must be true or false.')
  }

  const max = Number(process.env.DATABASE_POOL_MAX || 10)
  if (!Number.isInteger(max) || max < 1 || max > 50) {
    throw new Error('DATABASE_POOL_MAX must be an integer between 1 and 50.')
  }

  return new Pool({
    connectionString,
    ssl: tlsEnabled ? { rejectUnauthorized: true } : undefined,
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

export function safeDatabaseErrorMessage(error) {
  const urls = [process.env.DATABASE_URL, process.env.DATABASE_MIGRATION_URL].filter(Boolean)
  return urls.reduce(
    (message, url) => message.replaceAll(url, '[redacted database URL]'),
    String(error?.message || 'Database operation failed.')
  )
}

export const pool = process.env.DATABASE_URL ? createPool() : null

pool?.on('error', (error) => {
  console.error(JSON.stringify({
    level: 'error',
    event: 'postgres_pool_error',
    code: error.code || 'DATABASE_ERROR',
    errorType: error.name || 'Error',
  }))
})

export async function connectDB(databasePool = pool) {
  if (!databasePool) {
    throw new Error('DATABASE_URL is required. Configure it in AERO_BACK/.env.')
  }

  await databasePool.query('SELECT 1')
}
