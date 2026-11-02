import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateEnvironment } from '../src/config/env.js'

const validProductionEnvironment = {
  NODE_ENV: 'production',
  PORT: '5000',
  DATABASE_URL: 'postgresql://runtime:secret@db.example.test/aerocampus',
  DATABASE_SSL: 'true',
  DATABASE_POOL_MAX: '10',
  SESSION_SECRET: 'a-strong-production-session-secret-with-32-chars',
  CLIENT_URL: 'https://aerocampus.example,https://admin.aerocampus.example',
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-api-key',
  CLOUDINARY_API_SECRET: 'test-api-secret',
}

test('production environment requires explicit HTTPS origins, TLS, and a strong session secret', () => {
  const config = validateEnvironment(validProductionEnvironment)
  assert.deepEqual(config, {
    port: 5000,
    clientOrigins: ['https://aerocampus.example', 'https://admin.aerocampus.example'],
  })

  for (const override of [
    { CLIENT_URL: undefined },
    { CLIENT_URL: 'https://aerocampus.example/path' },
    { CLIENT_URL: 'http://aerocampus.example' },
    { DATABASE_SSL: 'false' },
    { SESSION_SECRET: 'short' },
  ]) {
    assert.throws(() => validateEnvironment({ ...validProductionEnvironment, ...override }))
  }
})

test('environment validation rejects malformed ports, pool sizes, and SSL values', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost/aerocampus',
    DATABASE_SSL: 'false',
    CLIENT_URL: 'http://localhost:5173',
  }

  assert.equal(validateEnvironment(base).port, 5000)
  assert.throws(() => validateEnvironment({ ...base, PORT: '70000' }), /PORT/)
  assert.throws(() => validateEnvironment({ ...base, DATABASE_POOL_MAX: '0' }), /DATABASE_POOL_MAX/)
  assert.throws(() => validateEnvironment({ ...base, DATABASE_SSL: 'sometimes' }), /DATABASE_SSL/)
  assert.throws(() => validateEnvironment({ ...base, TRUST_PROXY_HOPS: 'many' }), /TRUST_PROXY_HOPS/)
  assert.throws(() => validateEnvironment({ ...base, ADMIN_COOKIE_SAME_SITE: 'none' }), /only supported in production/)
})

test('production environment validates upload configuration', () => {
  assert.throws(() => validateEnvironment({ ...validProductionEnvironment, IMAGE_UPLOAD_MAX_MB: '6' }), /IMAGE_UPLOAD_MAX_MB/)
})
