import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ArticleCard from '../components/articles/ArticleCard.jsx'
import { fetchCategories, fetchPublishedPosts } from '../utils/api.js'

const PAGE_SIZE = 4

function Articles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageMeta, setPageMeta] = useState({ totalPages: 1, totalItems: 0 })
  const category = searchParams.get('category') || ''

  useEffect(() => {
    let active = true

    async function loadArticles() {
      setLoading(true)
      setError('')
      try {
        const [categoryResponse, postsResponse] = await Promise.all([
          fetchCategories(),
          fetchPublishedPosts({ page, limit: PAGE_SIZE, category, search: query }),
        ])

        if (!active) return
        setCategories([{ id: 'all', name: 'All topics', slug: '' }, ...categoryResponse])
        setArticles(postsResponse.posts)
        setPageMeta(postsResponse.meta)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadArticles()
    return () => {
      active = false
    }
  }, [page, category, query])

  function chooseCategory(value) {
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    if (value) next.set('category', value)
    else next.delete('category')
    setPage(1)
    setSearchParams(next, { replace: true })
  }

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    if (value) next.set('search', value)
    else next.delete('search')
    setPage(1)
    setQuery(value)
    setSearchParams(next, { replace: true })
  }

  const pageCount = Math.max(1, Number(pageMeta.totalPages) || 1)
  const currentPage = Math.min(page, pageCount)

  return (
    <>
      <section className="page-intro articles-intro">
        <div className="container">
          <div className="breadcrumb"><span>Explore</span><span>/</span><strong>Articles</strong></div>
          <span className="eyebrow">The AeroCampus journal</span>
          <h1>Stories for <span>curious minds.</span></h1>
          <p>Explore aviation, space, science, and the people opening up new possibilities in aerospace.</p>
        </div>
      </section>
      <section className="section articles-list-section">
        <div className="container">
          <div className="article-toolbar">
            <div className="filter-heading"><SlidersHorizontal size={17} /><span>Find your next read</span></div>
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Search articles</span>
              <input
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search by topic or keyword"
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => updateQuery('')}>
                  Clear
                </button>
              )}
            </label>
          </div>
          <div className="filter-row" aria-label="Filter articles by category">
            {categories.map((item) => (
              <button
                className={`filter-chip${category === item.slug ? ' selected' : ''}`}
                key={item.slug || 'all'}
                type="button"
                aria-pressed={category === item.slug}
                onClick={() => chooseCategory(item.slug)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="results-summary" aria-live="polite">
            {!loading && <><span>{pageMeta.totalItems || 0} {pageMeta.totalItems === 1 ? 'story' : 'stories'}</span>{(query || category) && <span> matching your filters</span>}</>}
          </div>

          {error ? (
            <div className="empty-state" role="alert">
              <h2>We couldn’t load the stories.</h2>
              <p>{error}</p>
              <button type="button" className="button button-outline" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="article-grid">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className="article-card article-card-skeleton" aria-hidden="true" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="article-grid">
              {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon"><Search size={22} /></span>
              <h2>No stories found</h2>
              <p>Try another search or choose a different topic.</p>
              <button
                className="button button-outline"
                type="button"
                onClick={() => {
                  setQuery('')
                  setPage(1)
                  setSearchParams({}, { replace: true })
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && pageCount > 1 && (
            <nav className="pagination" aria-label="Article pages">
              <button
                className="pagination-button"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <span aria-live="polite">Page {currentPage} of {pageCount}</span>
              <button
                className="pagination-button"
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Next <ArrowRight size={16} />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  )
}

export default Articles
