import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getImageExtension } from '../src/middleware/imageUpload.js'
import { validatePostPayload } from '../src/validation/admin.js'

test('uploaded image signatures map to safe file extensions', () => {
  assert.equal(getImageExtension(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'png')
  assert.equal(getImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'jpg')
  assert.equal(getImageExtension(Buffer.from('RIFF0000WEBP')), 'webp')
  assert.equal(getImageExtension(Buffer.from('0000ftypavif')), '')
  assert.equal(getImageExtension(Buffer.from('not an image')), '')
})

test('article covers accept bundled asset keys and uploaded image paths', () => {
  assert.equal(validatePostPayload({ coverImageUrl: 'asset:aviation' }, { partial: true }).coverImageUrl, 'asset:aviation')
  assert.equal(
    validatePostPayload({ coverImageUrl: '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000.webp' }, { partial: true }).coverImageUrl,
    '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000.webp'
  )
  assert.throws(
    () => validatePostPayload({ coverImageUrl: '/api/v1/uploads/../../secret.webp' }, { partial: true }),
    { code: 'VALIDATION_ERROR' }
  )
})

test('local uploaded image paths are accepted', () => {
  const imagePath = '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000.webp'
  const payload = validatePostPayload({ coverImageUrl: imagePath }, { partial: true })
  assert.equal(payload.coverImageUrl, imagePath)
})
