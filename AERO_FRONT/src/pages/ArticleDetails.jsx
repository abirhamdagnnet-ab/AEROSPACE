import { useEffect, useState } from 'react'
import { ArrowLeft, Clock3, RotateCw } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { fetchArticleBySlug } from '../utils/api.js'

function ArticleDetails() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadArticle() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchArticleBySlug(slug)
        if (active) setArticle(result)
      } catch (requestError) {
        if (active) setError(requestError)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadArticle()
    return () => {
      active = false
    }
  }, [slug, retryCount])

  if (loading) {
    return (
      <article className="article-detail">
        <div className="container article-detail-container">
          <div className="empty-state"><h2>Loading article…</h2></div>
        </div>
      </article>
    )
  }

  if (error?.status === 404) return <Navigate to="/not-found" replace />

  if (error) {
    return (
      <section className="section">
        <div className="container empty-state" role="alert">
          <h1>We couldn’t load this article.</h1>
          <p>{error.message}</p>
          <button
            className="button button-outline"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RotateCw size={16} /> Retry
          </button>
          <Link className="text-link" to="/articles">Back to all stories</Link>
        </div>
      </section>
    )
  }

  if (!article) return <Navigate to="/not-found" replace />

  return (
    <article className="article-detail">
      <div className="container article-detail-container">
        <Link className="back-link" to="/articles"><ArrowLeft size={16} /> Back to all stories</Link>
        <div className="article-detail-heading">
          <span className="category-label">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="article-detail-deck">{article.excerpt}</p>
          <div className="detail-byline">
            <span className="author-avatar" aria-hidden="true">{article.author.split(' ').map((name) => name[0]).join('')}</span>
            <span><strong>{article.author}</strong><small>{article.date}</small></span>
            <span className="detail-reading"><Clock3 size={15} /> {article.readingTime}</span>
          </div>
        </div>
        <img className="article-detail-image" src={article.image} alt={article.imageAlt} />
        <div className="article-body">
          <p className="article-lede">{article.body[0]}</p>
          {article.body.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="article-end-note">
            <span className="end-note-mark">A</span>
            <p>Keep exploring with AeroCampus. Great questions take us further.</p>
          </div>
          <Link className="text-link" to="/articles">Discover more stories <ArrowLeft className="arrow-flip" size={16} /></Link>
        </div>
      </div>
    </article>
  )
}

export default ArticleDetails
