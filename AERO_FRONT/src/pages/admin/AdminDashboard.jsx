import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenText, Clock3, FilePenLine, Mail, Plus, Send, Tags } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { adminRequest } from '../../utils/adminApi.js'

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    adminRequest('/admin/dashboard')
      .then(({ data }) => { if (active) setDashboard(data) })
      .catch((requestError) => { if (active) { setError(requestError.message); toast.error(requestError.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">YOUR CONTENT, AT A GLANCE</span><h1>Overview</h1><p>A clear view of the work moving AeroCampus forward.</p></div>
        <Link className="admin-primary-button" to="/admin/articles/new"><Plus size={17} /> New article</Link>
      </div>
      {loading ? (
        <div className="admin-panel admin-state"><span className="admin-spinner" /> Loading your dashboard…</div>
      ) : dashboard ? (
        <>
          <section className="admin-stats-grid" aria-label="Article statistics">
            <article className="admin-stat-card"><span className="admin-stat-icon stat-blue"><BookOpenText size={19} /></span><span className="admin-stat-label">Total articles</span><strong>{dashboard.total_articles}</strong><small>Across all statuses</small></article>
            <article className="admin-stat-card"><span className="admin-stat-icon stat-green"><Send size={18} /></span><span className="admin-stat-label">Published</span><strong>{dashboard.published_articles}</strong><small>Visible to readers</small></article>
            <article className="admin-stat-card"><span className="admin-stat-icon stat-orange"><FilePenLine size={19} /></span><span className="admin-stat-label">Drafts</span><strong>{dashboard.draft_articles}</strong><small>Still taking shape</small></article>
            <article className="admin-stat-card"><span className="admin-stat-icon stat-blue"><Tags size={19} /></span><span className="admin-stat-label">Categories</span><strong>{dashboard.total_categories}</strong><small>Available topics</small></article>
            <article className="admin-stat-card"><span className="admin-stat-icon stat-green"><Mail size={18} /></span><span className="admin-stat-label">Messages</span><strong>{dashboard.total_messages}</strong><small>Contact submissions</small></article>
          </section>
          <section className="admin-panel admin-recent-panel">
            <div className="admin-panel-heading">
              <div><h2>Recent articles</h2><p>Your latest edits and updates.</p></div>
              <Link className="admin-inline-link" to="/admin/articles">All articles <ArrowRight size={15} /></Link>
            </div>
            {dashboard.recentArticles.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Article</th><th>Category</th><th>Status</th><th>Last updated</th><th><span className="admin-sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {dashboard.recentArticles.map((article) => (
                      <tr key={article.id}>
                        <td><Link className="admin-table-title" to={`/admin/articles/${article.id}/edit`}>{article.title}</Link><small>/{article.slug}</small></td>
                        <td>{article.category_name}</td>
                        <td><span className={`admin-status status-${article.status}`}>{article.status}</span></td>
                        <td><span className="admin-date"><Clock3 size={13} /> {new Date(article.updated_at).toLocaleDateString()}</span></td>
                        <td><Link className="admin-row-action" to={`/admin/articles/${article.id}/edit`} aria-label={`Edit ${article.title}`}><ArrowRight size={16} /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="admin-empty-state"><span><BookOpenText size={22} /></span><h3>Nothing published yet.</h3><p>Start with a story, an idea, or a question worth exploring.</p><Link className="admin-primary-button" to="/admin/articles/new"><Plus size={16} /> Create your first article</Link></div>
              )}
            </section>
        </>
      ) : error ? <div className="admin-panel admin-state admin-error-state">Unable to load the dashboard. {error}</div> : null}
    </div>
  )
}

export default AdminDashboard
