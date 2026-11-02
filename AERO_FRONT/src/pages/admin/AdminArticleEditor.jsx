import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Eye, Save, Send, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminRequest, adminUpload } from '../../utils/adminApi.js'
import { resolveArticleImage } from '../../utils/api.js'

const MAX_IMAGE_SIZE_MB = Math.min(5, Math.max(1, Number(import.meta.env.VITE_IMAGE_UPLOAD_MAX_MB) || 5))
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const emptyArticle = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  categoryId: '',
}

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200).replace(/-+$/g, '')
}

function AdminArticleEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const [article, setArticle] = useState(emptyArticle)
  const [categories, setCategories] = useState([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [preview, setPreview] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('draft')
  const formRef = useRef(null)

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
  }, [localPreviewUrl])

  useEffect(() => {
    let active = true
    const requests = [adminRequest('/admin/categories')]
    if (id) requests.push(adminRequest(`/admin/posts/${id}`))
    Promise.all(requests)
      .then(([categoryResponse, postResponse]) => {
        if (!active) return
        setCategories(categoryResponse.data)
        if (postResponse) {
          const post = postResponse.data
          setArticle({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImageUrl: post.cover_image_url || '',
            categoryId: String(post.category_id),
          })
          setCurrentStatus(post.status)
          setSlugEdited(true)
        }
      })
      .catch((requestError) => { if (active) toast.error(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  function updateField(field, value) {
    setArticle((current) => {
      const next = { ...current, [field]: value }
      if (field === 'title' && !slugEdited) next.slug = slugify(value)
      return next
    })
  }

  async function save(status) {
    if (uploadingImage) {
      toast.error('Wait for the cover image upload to finish before saving.')
      return
    }
    if (!formRef.current) {
      toast.error('The article form is not ready. Please reload and try again.')
      return
    }
    if (!formRef.current.reportValidity()) {
      const invalidField = formRef.current.querySelector(':invalid')
      invalidField?.focus()
      toast.error('Complete the required fields and correct the highlighted values before saving.')
      return
    }
    setSaving(true)
    const payload = { ...article, status }
    try {
      const result = await adminRequest(isEditing ? `/admin/posts/${id}` : '/admin/posts', {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
        csrf: true,
      })
      const message = status === 'published' ? 'Article published successfully.' : 'Draft saved successfully.'
      setCurrentStatus(status)
      toast.success(message)
      if (!isEditing) navigate(`/admin/articles/${result.data.id}/edit`, { replace: true })
    } catch (requestError) {
      const message = requestError.message || 'Unable to save article.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function uploadCoverImage(event) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be ${MAX_IMAGE_SIZE_MB} MB or smaller.`)
      return
    }

    setLocalPreviewUrl(URL.createObjectURL(file))
    setUploadProgress(0)
    setUploadingImage(true)
    try {
      const result = await adminUpload('/admin/uploads', file, { onProgress: setUploadProgress })
      updateField('coverImageUrl', result.data.url)
      setLocalPreviewUrl('')
      toast.success('Cover image uploaded.')
    } catch (requestError) {
      setLocalPreviewUrl('')
      toast.error(requestError.message || 'Unable to upload the cover image.')
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) return <div className="admin-panel admin-state"><span className="admin-spinner" /> Loading article editor…</div>

  return (
    <div className="admin-page admin-editor-page">
      <div className="admin-editor-top">
        <Link className="admin-back-link" to="/admin/articles"><ArrowLeft size={16} /> All articles</Link>
        <div className="admin-editor-actions">
          {isEditing && <Link className="admin-secondary-button" to={`/articles/${article.slug}`} target="_blank" rel="noreferrer"><Eye size={16} /> View public page</Link>}
          <button className="admin-secondary-button" type="button" onClick={() => setPreview(true)}><Eye size={16} /> Preview</button>
          <button className="admin-secondary-button" type="button" disabled={saving || uploadingImage} onClick={() => save('draft')}><Save size={16} /> Save draft</button>
          <button className="admin-primary-button" type="button" disabled={saving || uploadingImage} onClick={() => save('published')}><Send size={16} /> {saving ? 'Saving…' : 'Publish'}</button>
        </div>
      </div>
      <div className="admin-editor-heading"><span className="admin-eyebrow">{isEditing ? 'EDIT YOUR STORY' : 'CREATE SOMETHING NEW'}</span><h1>{isEditing ? 'Shape your article.' : 'Start with a story.'}</h1><p>Thoughtful ideas deserve a clear path to curious readers.</p></div>
      <form ref={formRef} className="admin-editor-grid" onSubmit={(event) => event.preventDefault()}>
        <section className="admin-panel admin-editor-main">
          <label className="admin-field admin-title-field">Article title
            <input value={article.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Give your story a title" minLength={5} maxLength={180} required />
          </label>
          <label className="admin-field">URL slug
            <div className="admin-slug-input"><span>/articles/</span><input value={article.slug} onChange={(event) => { setSlugEdited(true); updateField('slug', event.target.value) }} placeholder="your-article-slug" maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></div>
            <small>Generated from the title. You can edit it; a duplicate slug gets a safe numbered suffix on create.</small>
          </label>
          <label className="admin-field">Excerpt
            <textarea value={article.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} placeholder="A short introduction to this story…" minLength={20} maxLength={320} rows={3} required />
          </label>
          <label className="admin-field">Article content
            <textarea className="admin-content-input" value={article.content} onChange={(event) => updateField('content', event.target.value)} placeholder="Write your article here…" minLength={40} maxLength={50000} rows={18} required />
            <small>Plain text content. Use line breaks to structure paragraphs.</small>
          </label>
        </section>
        <aside className="admin-editor-side">
          <section className="admin-panel admin-publish-panel">
            <h2>Publishing</h2>
            <p>Current status: <span className={`admin-status status-${currentStatus}`}>{isEditing ? currentStatus : 'draft'}</span></p>
            <div className="admin-publish-divider" />
            <button className="admin-side-publish" type="button" disabled={saving || uploadingImage} onClick={() => save('published')}><Send size={16} /> Publish article</button>
            <button className="admin-side-draft" type="button" disabled={saving || uploadingImage} onClick={() => save('draft')}><Save size={16} /> Save as draft</button>
            {isEditing && currentStatus === 'published' && <button className="admin-unpublish" type="button" disabled={saving || uploadingImage} onClick={() => save('draft')}>Unpublish article</button>}
          </section>
          <section className="admin-panel">
            <h2>Category</h2>
            <label className="admin-field">Assign a topic
              <select value={article.categoryId} onChange={(event) => updateField('categoryId', event.target.value)} required>
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {!categories.length && <p className="admin-field-help">Create a category before saving an article.</p>}
          </section>
          <section className="admin-panel">
            <h2>Cover image</h2>
            <label className="admin-upload-button">
              <Upload size={16} />
              {uploadingImage ? 'Uploading image…' : 'Choose an image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCoverImage} disabled={saving || uploadingImage} />
            </label>
            <small className="admin-upload-help">JPG, PNG, or WebP. Maximum file size: {MAX_IMAGE_SIZE_MB} MB.</small>
            {uploadingImage && <div className="admin-upload-progress-wrap"><progress className="admin-upload-progress" value={uploadProgress} max="100" aria-label="Image upload progress" /><small>{uploadProgress}% uploaded</small></div>}
            {(localPreviewUrl || article.coverImageUrl) && (
              <div className="admin-cover-container">
                <img className="admin-cover-preview" src={localPreviewUrl || resolveArticleImage(article.coverImageUrl)} alt="Cover image preview" onError={(event) => { event.currentTarget.hidden = true }} onLoad={(event) => { event.currentTarget.hidden = false }} />
                <button className="admin-remove-image" type="button" disabled={uploadingImage} onClick={() => { updateField('coverImageUrl', ''); setLocalPreviewUrl('') }}>Remove image</button>
              </div>
            )}
          </section>
        </aside>
      </form>
      {preview && (
        <div className="admin-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(false) }}>
          <section className="admin-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="admin-preview-toolbar"><span>ARTICLE PREVIEW · NOT PUBLISHED</span><button type="button" aria-label="Close preview" onClick={() => setPreview(false)}><X size={20} /></button></div>
            {article.coverImageUrl && <img className="admin-preview-image" src={resolveArticleImage(article.coverImageUrl)} alt="" />}
            <div className="admin-preview-content">
              <span className="admin-preview-category">{categories.find((category) => String(category.id) === article.categoryId)?.name || 'AEROCAMPUS'}</span>
              <h2 id="preview-title">{article.title || 'Your article title'}</h2>
              <p className="admin-preview-excerpt">{article.excerpt || 'Your article excerpt will appear here.'}</p>
              <div className="admin-preview-body">{(article.content || 'Your article content will appear here.').split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminArticleEditor
