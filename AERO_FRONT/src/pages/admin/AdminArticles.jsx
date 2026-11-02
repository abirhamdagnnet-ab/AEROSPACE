import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, FilePenLine, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { adminRequest } from '../../utils/adminApi.js'

function AdminArticles() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [page, setPage] = useState(Number(params.get('page')) || 1)
  const [result, setResult] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState(params.get('categoryId') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ page: String(page), limit: '10' })
    if (search.trim()) query.set('search', search.trim())
    if (status) query.set('status', status)
    if (categoryId) query.set('categoryId', categoryId)
    setParams(query, { replace: true })
    setLoading(true)
    adminRequest(`/admin/posts?${query}`)
      .then(({ data, meta }) => { if (active) setResult({ posts: data, meta }) })
      .catch((requestError) => { if (active) toast.error(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, status, categoryId, setParams])

  useEffect(() => {
    let active = true
    adminRequest('/admin/categories')
      .then(({ data }) => { if (active) setCategories(data) })
      .catch((requestError) => { if (active) toast.error(requestError.message) })
    return () => { active = false }
  }, [])

  async function deleteArticle(article) {
    if (!window.confirm(`Delete “${article.title}”? This action cannot be undone.`)) return
    try {
      await adminRequest(`/admin/posts/${article.id}`, { method: 'DELETE', csrf: true })
      const query = new URLSearchParams({ page: String(page), limit: '10' })
      if (search.trim()) query.set('search', search.trim())
      if (status) query.set('status', status)
      if (categoryId) query.set('categoryId', categoryId)
      const { data, meta } = await adminRequest(`/admin/posts?${query}`)
      setResult({ posts: data, meta })
      toast.success('Article deleted successfully.')
    } catch (requestError) {
      const message = requestError.message || 'Unable to delete article.'
      toast.error(message)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">EDITORIAL WORKSPACE</span><h1>Articles</h1><p>Manage drafts and published stories in one place.</p></div>
        <Link className="admin-primary-button" to="/admin/articles/new"><Plus size={17} /> New article</Link>
      </div>
      <section className="admin-panel admin-articles-panel">
        <div className="admin-list-toolbar">
          <label className="admin-search"><Search size={17} /><span className="admin-sr-only">Search articles</span><input type="search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search articles…" /></label>
          <label className="admin-select-label"><span className="admin-sr-only">Filter by status</span><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select></label>
          <label className="admin-select-label"><span className="admin-sr-only">Filter by category</span><select value={categoryId} onChange={(event) => { setPage(1); setCategoryId(event.target.value) }}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </div>
        {loading ? (
          <div className="admin-state"><span className="admin-spinner" /> Loading articles…</div>
        ) : result?.posts.length ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Article</th><th>Category</th><th>Status</th><th>Author</th><th>Updated</th><th><span className="admin-sr-only">Actions</span></th></tr></thead>
                <tbody>{result.posts.map((article) => (
                  <tr key={article.id}>
                    <td><Link className="admin-table-title" to={`/admin/articles/${article.id}/edit`}>{article.title}</Link><small>/{article.slug}{article.is_sample ? ' · Sample' : ''}</small></td>
                    <td>{article.category_name}</td>
                    <td><span className={`admin-status status-${article.status}`}>{article.status}</span></td>
                    <td>{article.author_name}</td>
                    <td>{new Date(article.updated_at).toLocaleDateString()}</td>
                    <td><div className="admin-category-actions"><Link className="admin-row-action" to={`/admin/articles/${article.id}/edit`} aria-label={`Edit ${article.title}`}><FilePenLine size={16} /></Link><button className="admin-row-action is-danger" type="button" onClick={() => deleteArticle(article)} aria-label={`Delete ${article.title}`}><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>{result.meta.totalItems} articles · Page {result.meta.page} of {Math.max(1, result.meta.totalPages)}</span>
              <div>
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft size={16} /></button>
                <button type="button" aria-label="Next page" disabled={page >= result.meta.totalPages} onClick={() => setPage((value) => value + 1)}><ArrowRight size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-empty-state"><span><Search size={22} /></span><h3>No articles found.</h3><p>Try a different search or create a new story.</p><Link className="admin-primary-button" to="/admin/articles/new"><Plus size={16} /> Create article</Link></div>
        )}
      </section>
    </div>
  )
}

export default AdminArticles
