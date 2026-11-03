import aviationCover from '../assets/one4.avif'
import spaceCover from '../assets/one5.avif'
import scienceCover from '../assets/ones1.avif'
import careerCover from '../assets/ones2.avif'
import defaultCover from '../assets/ones3.avif'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')
const localImageAssets = {
  'asset:aviation': aviationCover,
  'asset:space': spaceCover,
  'asset:science': scienceCover,
  'asset:careers': careerCover,
  'asset:default': defaultCover,
}
const legacyImageAssets = {
  'photo-1436491865332': aviationCover,
  'photo-1446776811953': spaceCover,
  'photo-1517976487492': careerCover,
  'photo-1529070538774': scienceCover,
  'photo-1451187580459': spaceCover,
  'photo-1457364887197': careerCover,
}

export function resolveArticleImage(image) {
  if (typeof image !== 'string' || !image) return ''
  if (localImageAssets[image]) return localImageAssets[image]
  const legacyImage = Object.entries(legacyImageAssets).find(([imageId]) => image.includes(imageId))
  if (legacyImage) return legacyImage[1]
  return image
}

function toApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function estimateReadingTime(content = '') {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(2, Math.ceil(words / 180))
  return `${minutes} min read`
}

function formatPublishedDate(value) {
  if (!value) return 'Recent'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function normalizeArticle(article = {}) {
  const content = typeof article.content === 'string' ? article.content : ''
  const excerpt = typeof article.excerpt === 'string' ? article.excerpt : ''
  const paragraphs = content
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const sourceImage = article.cover_image_url || article.image || 'asset:space'

  return {
    id: article.id,
    slug: article.slug,
    title: article.title || 'Untitled article',
    excerpt,
    author: article.author_name || article.author || 'AeroCampus',
    date: formatPublishedDate(article.published_at || article.updated_at || article.created_at),
    readingTime: article.reading_time || article.readingTime || estimateReadingTime(content || excerpt),
    image: resolveArticleImage(sourceImage),
    imageAlt: article.title || 'Aerospace article cover',
    category: article.category_name || article.category || 'General',
    categorySlug: article.category_slug || article.categorySlug || '',
    isSample: article.is_sample === true || article.isSample === true,
    body: paragraphs.length ? paragraphs : [excerpt || 'Aerospace article'],
    content,
    coverImageUrl: sourceImage,
  }
}

export async function apiFetch(path, options = {}) {
  let response
  try {
    response = await fetch(toApiUrl(path), {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error('Unable to reach the AeroCampus service. Check your connection and try again.')
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'The request could not be completed.')
    error.status = response.status
    error.code = payload?.error?.code
    error.details = payload?.error?.details
    throw error
  }

  return payload
}

export async function fetchPublishedPosts({ page = 1, limit = 9, search = '', category = '' } = {}) {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  if (search) params.set('search', search)
  if (category) params.set('category', category)

  const response = await apiFetch(`/posts${params.toString() ? `?${params.toString()}` : ''}`)
  return {
    posts: (response?.data || []).map(normalizeArticle),
    meta: response?.meta || {},
  }
}

export async function fetchCategories() {
  const response = await apiFetch('/categories')
  return response?.data || []
}

export async function fetchArticleBySlug(slug) {
  const response = await apiFetch(`/posts/${encodeURIComponent(slug)}`)
  return normalizeArticle(response?.data || {})
}

export async function submitContactMessage(payload) {
  return apiFetch('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
