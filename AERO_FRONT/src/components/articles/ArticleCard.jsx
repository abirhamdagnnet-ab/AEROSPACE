import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

function ArticleCard({ article, compact = false }) {
  return (
    <article className={`article-card${compact ? ' article-card-compact' : ''}`}>
      <Link className="article-image-link" to={`/articles/${article.slug}`} aria-label={`Read ${article.title}`}>
        <img className="article-image" src={article.image} alt={article.imageAlt} loading="lazy" />
        <span className="image-arrow" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="article-card-content">
        <div className="article-meta-top">
          <span className="category-label">{article.category}</span>
          <span className="reading-time"><Clock3 size={14} /> {article.readingTime}</span>
        </div>
        <h3><Link to={`/articles/${article.slug}`}>{article.title}</Link></h3>
        {!compact && <p className="article-excerpt">{article.excerpt}</p>}
        <div className="article-byline">
          <span>{article.author}</span>
          <span className="byline-dot" aria-hidden="true">·</span>
          <time>{article.date}</time>
        </div>
      </div>
    </article>
  )
}

export default ArticleCard
