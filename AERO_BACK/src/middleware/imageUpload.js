import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import AppError from '../utils/AppError.js'

const maximumImageSize = Number(process.env.IMAGE_UPLOAD_MAX_MB || 5) * 1024 * 1024
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const parseImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximumImageSize, files: 1, fields: 0 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError('Choose a JPG, PNG, or WebP image.', 400, 'INVALID_IMAGE'))
      return
    }
    callback(null, true)
  },
}).single('image')

export function getImageExtension(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return ''
}

const mimeTypeByExtension = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

export function receiveImage(request, response, next) {
  parseImage(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? `Image must be ${process.env.IMAGE_UPLOAD_MAX_MB || 5} MB or smaller.`
        : 'Upload one image at a time.'
      next(new AppError(message, 400, 'INVALID_IMAGE'))
      return
    }
    if (error) {
      next(error)
      return
    }
    if (!request.file) {
      next(new AppError('Choose an image to upload.', 400, 'INVALID_IMAGE'))
      return
    }

    const extension = getImageExtension(request.file.buffer)
    if (!extension || mimeTypeByExtension[extension] !== request.file.mimetype) {
      next(new AppError('The selected file is not a valid JPG, PNG, or WebP image.', 400, 'INVALID_IMAGE'))
      return
    }

    request.file.imageExtension = extension
    next()
  })
}

export async function saveImage(request, _response, next) {
  try {
    if (!request.file) {
      throw new AppError('Choose an image to upload.', 400, 'INVALID_IMAGE')
    }

    const extension = getImageExtension(request.file.buffer)
    if (!extension) {
      throw new AppError('The selected file is not a supported image.', 400, 'INVALID_IMAGE')
    }

    const filename = `${randomUUID()}.${extension}`
    await mkdir(request.uploadDirectory, { recursive: true })
    await writeFile(path.join(request.uploadDirectory, filename), request.file.buffer, { flag: 'wx' })
    request.uploadedImageUrl = `/api/v1/uploads/${filename}`
    next()
  } catch (error) {
    next(error)
  }
}
