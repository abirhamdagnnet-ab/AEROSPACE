const DEFAULT_PORT = 5000
const DEFAULT_CLIENT_URL = 'http://localhost:5173'
const VALID_DATABASE_URL = /^postgres(?:ql)?:\/\//

function parseOriginList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function validateOrigins(origins, production) {
  if (!origins.length) {
    throw new Error('CLIENT_URL must contain at least one allowed frontend origin.')
  }

  for (const origin of origins) {
    let parsed
    try {
      parsed = new URL(origin)
    } catch {
      throw new Error('CLIENT_URL must contain valid frontend origins.')
    }
    if (parsed.origin !== origin || !['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('CLIENT_URL entries must be origins without paths, queries, or fragments.')
    }
    if (production && parsed.protocol !== 'https:') {
      throw new Error('CLIENT_URL origins must use HTTPS in production.')
    }
  }

  return origins
}

export function validateEnvironment(env = process.env) {
  const production = env.NODE_ENV === 'production'
  const port = Number(env.PORT || DEFAULT_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }
  if (!env.DATABASE_URL || !VALID_DATABASE_URL.test(env.DATABASE_URL)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL.')
  }
  if (env.DATABASE_MIGRATION_URL && !VALID_DATABASE_URL.test(env.DATABASE_MIGRATION_URL)) {
    throw new Error('DATABASE_MIGRATION_URL must be a PostgreSQL connection URL.')
  }
  if (env.DATABASE_SSL !== undefined && !['true', 'false'].includes(env.DATABASE_SSL)) {
    throw new Error('DATABASE_SSL must be true or false.')
  }
  if (production && env.DATABASE_SSL !== 'true') {
    throw new Error('DATABASE_SSL=true is required in production.')
  }
  if (env.DATABASE_POOL_MAX !== undefined) {
    const poolMax = Number(env.DATABASE_POOL_MAX)
    if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 50) {
      throw new Error('DATABASE_POOL_MAX must be an integer between 1 and 50.')
    }
  }
  if (env.TRUST_PROXY_HOPS !== undefined) {
    const proxyHops = Number(env.TRUST_PROXY_HOPS)
    if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) {
      throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.')
    }
  }
  if (env.ADMIN_COOKIE_SAME_SITE !== undefined && !['strict', 'lax', 'none'].includes(env.ADMIN_COOKIE_SAME_SITE)) {
    throw new Error('ADMIN_COOKIE_SAME_SITE must be strict, lax, or none.')
  }
  if (env.ADMIN_COOKIE_SAME_SITE === 'none' && !production) {
    throw new Error('ADMIN_COOKIE_SAME_SITE=none is only supported in production over HTTPS.')
  }
  if (env.IMAGE_UPLOAD_MAX_MB !== undefined) {
    const imageUploadMaxMb = Number(env.IMAGE_UPLOAD_MAX_MB)
    if (!Number.isInteger(imageUploadMaxMb) || imageUploadMaxMb < 1 || imageUploadMaxMb > 5) {
      throw new Error('IMAGE_UPLOAD_MAX_MB must be an integer between 1 and 5.')
    }
  }
  if (production && (env.SESSION_SECRET || '').length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters in production.')
  }
  if (production && !env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be explicitly configured in production.')
  }
  const clientOrigins = validateOrigins(
    parseOriginList(env.CLIENT_URL || DEFAULT_CLIENT_URL),
    production
  )

  return { port, clientOrigins }
}
