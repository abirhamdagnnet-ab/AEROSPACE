import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Orbit,
  Rocket,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ArticleCard from '../components/articles/ArticleCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { fetchCategories, fetchPublishedPosts } from '../utils/api.js'
import heroImage from '../assets/ones6.avif'
import missionImage from '../assets/ones3.avif'
function Home() {
  const [featuredArticles, setFeaturedArticles] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadHomeContent() {
      try {
        const [postsResult, categoriesResult] = await Promise.all([
          fetchPublishedPosts({ page: 1, limit: 6 }),
          fetchCategories(),
        ])

        if (!active) return

        const posts = postsResult.posts
        setFeaturedArticles(posts.slice(0, 3))
        setLatestArticles(posts.slice(3, 6))
        setCategories(categoriesResult.slice(0, 4))
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHomeContent()
    return () => {
      active = false
    }
  }, [])

  const categoryCards = [
    {
      title: 'Aviation',
      description: 'Explore the technology and people behind flight.',
      icon: '✳',
      color: 'blue',
      slug: 'aviation',
    },
    {
      title: 'Space',
      description: 'Go further with satellites, rockets, and discovery.',
      icon: '',
      color: 'violet',
      slug: 'space',
    },
    {
      title: 'Science',
      description: 'Find the big ideas behind aerospace innovation.',
      icon: '◉',
      color: 'orange',
      slug: 'science',
    },
    {
      title: 'Careers',
      description: 'Meet the many paths into the aerospace world.',
      icon: '↗',
      color: 'green',
      slug: 'careers',
    },
  ].map((card) => ({
    ...card,
    title: categories.find((category) => category.slug === card.slug)?.name || card.title,
    description: categories.find((category) => category.slug === card.slug)?.description || card.description,
  }))

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span /> A new perspective on aerospace</div>
            <h1>Explore Aerospace.<br /><span>Discover Your Future.</span></h1>
            <p>
              The sky is not the limit. Find stories, ideas, and pathways into the world of
              aviation and space.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/articles">
                Explore articles <ArrowRight size={17} />
              </Link>
              <Link className="button button-ghost-light" to="/careers">
                Discover careers <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="hero-note-icon"><Sparkles size={16} /></span>
              <span>Curiosity is your launchpad.</span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={heroImage}
              alt="Rocket ascending into a clear sky"
            />
            <div className="hero-image-shade" />
            <div className="hero-image-caption">
              <span>LOOK UP. THINK BIG.</span>
              <span className="caption-line" />
              <span>01 / 04</span>
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <Orbit size={23} />
              <span>LEARN<br />BEYOND</span>
            </div>
          </div>
          <a className="scroll-cue" href="#featured" aria-label="Scroll to featured stories">
            <ArrowDownRight size={16} /> Scroll to explore
          </a>
        </div>
      </section>

      {error ? (
        <section className="section">
          <div className="container">
            <div className="empty-state" role="alert">
              <h2>We couldn’t load the latest stories.</h2>
              <p>{error}</p>
              <button type="button" className="button button-outline" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="section section-featured" id="featured">
            <div className="container">
              <SectionHeading
                eyebrow="Start exploring"
                title="Ideas that take you further."
                description="Fresh perspectives on the science, technology, and people shaping aerospace."
                action={<Link className="text-link" to="/articles">All articles <ArrowRight size={16} /></Link>}
              />
              {loading ? (
                <div className="article-grid">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="article-card article-card-skeleton" aria-hidden="true" />
                  ))}
                </div>
              ) : featuredArticles.length ? (
                <div className="article-grid">
                  {featuredArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No stories published yet.</h2>
                  <p>New aerospace content will appear here as soon as it is published.</p>
                </div>
              )}
            </div>
          </section>

          <section className="section latest-section">
            <div className="container">
              <SectionHeading
                eyebrow="Fresh from AeroCampus"
                title="The latest from the field."
                description="New perspectives to keep your curiosity in motion."
                action={<Link className="text-link" to="/articles">Read every story <ArrowRight size={16} /></Link>}
              />
              {loading ? (
                <div className="article-grid">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`latest-${index}`} className="article-card article-card-skeleton" aria-hidden="true" />
                  ))}
                </div>
              ) : latestArticles.length ? (
                <div className="article-grid">
                  {latestArticles.map((article) => (
                    <ArticleCard key={article.slug} article={article} compact />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No recent stories available.</h2>
                  <p>Check back soon for new aerospace insights.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <section className="section section-categories">
        <div className="container">
          <SectionHeading
            eyebrow="Find your orbit"
            title="A universe of things to learn."
            description="Choose a direction. There is always something new on the horizon."
          />
          <div className="category-grid">
            {categoryCards.map((category) => (
              <Link
                className={`category-card category-${category.color}`}
                key={category.title}
                to={category.slug === 'careers'
                  ? '/careers'
                  : `/articles?category=${encodeURIComponent(category.slug)}`}
              >
                <span className="category-icon" aria-hidden="true">{category.icon}</span>
                <span className="category-card-arrow"><ArrowUpRight size={18} /></span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="career-band">
        <div className="container career-band-inner">
          <div className="career-band-icon"><Compass size={25} /></div>
          <div className="career-band-copy">
            <span className="eyebrow">A future worth exploring</span>
            <h2>Your aerospace journey starts here.</h2>
            <p>From the cockpit to the control room, find a path that fits your curiosity.</p>
          </div>
          <Link className="button button-light" to="/careers">Explore career paths <ArrowRight size={17} /></Link>
          <div className="career-band-orbit" aria-hidden="true"><Rocket size={64} /></div>
        </div>
      </section>

      <section className="section mission-section">
        <div className="container mission-grid">
          <div className="mission-image-wrap">
            <img
              src={missionImage}
              alt="Earth at night with glowing city lights"
              loading="lazy"
            />
            <div className="mission-image-label"><span>01</span> A bigger view starts with access.</div>
          </div>
          <div className="mission-copy">
            <span className="eyebrow">Why AeroCampus</span>
            <h2>Big ideas belong to everyone.</h2>
            <p>
              Aerospace can feel far away. We make it easier to get close through clear,
              engaging learning and stories that connect classroom ideas to real-world
              possibilities.
            </p>
            <Link className="text-link" to="/about">Get to know our mission <ArrowRight size={16} /></Link>
            <div className="mission-stat">
              <span className="mission-stat-icon"><Orbit size={17} /></span>
              <span>Explore Aerospace. Understand the Future.<br /><strong>Imagine what comes next.</strong></span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
