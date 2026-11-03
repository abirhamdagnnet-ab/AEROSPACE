import { useEffect, useState } from 'react'
import { Edit3, Plus, Tags, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminRequest } from '../../utils/adminApi.js'

const blankCategory = { name: '', slug: '', description: '' }

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '')
}

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankCategory)
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadCategories() {
    setLoading(true)
    try {
      const { data } = await adminRequest('/admin/categories')
      setCategories(data)
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  function startCreate() {
    setEditing({ id: null })
    setForm(blankCategory)
    setSlugEdited(false)
  }

  function startEdit(category) {
    setEditing(category)
    setForm({ name: category.name, slug: category.slug, description: category.description || '' })
    setSlugEdited(true)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const isUpdate = Boolean(editing.id)
      await adminRequest(isUpdate ? `/admin/categories/${editing.id}` : '/admin/categories', {
        method: isUpdate ? 'PUT' : 'POST',
        body: form,
        csrf: true,
      })
      const message = isUpdate ? 'Category updated.' : 'Category created.'
      setEditing(null)
      toast.success(message)
      await loadCategories()
    } catch (requestError) {
      const message = requestError.message || 'Unable to save category.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete the “${category.name}” category? Articles assigned to it cannot be deleted this way.`)) return
    try {
      await adminRequest(`/admin/categories/${category.id}`, { method: 'DELETE', csrf: true })
      const message = 'Category deleted.'
      toast.success(message)
      await loadCategories()
    } catch (requestError) {
      const message = requestError.message || 'Unable to delete category.'
      toast.error(message)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">ORGANIZE YOUR STORIES</span><h1>Categories</h1><p>Keep topics clear and help readers find their orbit.</p></div>
        <button className="admin-primary-button" type="button" onClick={startCreate}><Plus size={17} /> New category</button>
      </div>
      <section className="admin-panel admin-category-panel">
        <div className="admin-panel-heading"><div><h2>All categories</h2><p>Categories currently available to your articles.</p></div><span className="admin-count-pill">{categories.length} topics</span></div>
        {loading ? <div className="admin-state"><span className="admin-spinner" /> Loading categories…</div> : categories.length ? (
          <div className="admin-category-list">
            {categories.map((category) => (
              <article className="admin-category-row" key={category.id}>
                <span className="admin-category-icon"><Tags size={18} /></span>
                <div className="admin-category-copy"><strong>{category.name}</strong><span>/{category.slug}</span>{category.description && <p>{category.description}</p>}</div>
                <span className="admin-category-usage">{category.article_count} {category.article_count === 1 ? 'article' : 'articles'}</span>
                <div className="admin-category-actions">
                  <button className="admin-row-action" type="button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}><Edit3 size={16} /></button>
                  <button className="admin-row-action is-danger" type="button" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="admin-empty-state"><span><Tags size={22} /></span><h3>No categories yet.</h3><p>Create a category to organize your articles.</p><button className="admin-primary-button" type="button" onClick={startCreate}><Plus size={16} /> Create category</button></div>}
      </section>
      {editing && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null) }}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <div className="admin-modal-heading"><div><span className="admin-eyebrow">{editing.id ? 'EDIT TOPIC' : 'ADD TO YOUR COLLECTION'}</span><h2 id="category-modal-title">{editing.id ? 'Edit category' : 'New category'}</h2></div><button className="admin-icon-button" type="button" aria-label="Close" onClick={() => setEditing(null)}><X size={19} /></button></div>
            <form onSubmit={save}>
              <label className="admin-field">Category name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: slugEdited ? current.slug : slugify(event.target.value) }))} minLength={2} maxLength={60} required autoFocus /></label>
              <label className="admin-field">URL slug<input value={form.slug} onChange={(event) => { setSlugEdited(true); setForm((current) => ({ ...current, slug: event.target.value })) }} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /><small>Generated from the category name.</small></label>
              <label className="admin-field">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={240} /></label>
              <div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create category'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminCategories
