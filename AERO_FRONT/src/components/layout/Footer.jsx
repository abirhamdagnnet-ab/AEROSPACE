import { ArrowUpRight, Instagram, Linkedin, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../../assets/aerocampus-logo.svg'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-block">
            <Link className="brand brand-footer" to="/">
              <img className="brand-logo brand-logo-footer" src={logo} alt="AeroCampus logo" />
            </Link>
            <p>Opening up aerospace learning and career pathways for the next generation.</p>
          </div>
          <div className="footer-column">
            <h2>Explore</h2>
            <Link to="/aerospace-engineering">Aerospace engineering</Link>
            <Link to="/articles">Articles</Link>
            <Link to="/aerospace-engineering#career-opportunities">Career opportunities</Link>
            <Link to="/about">Our mission</Link>
          </div>
          <div className="footer-column">
            <h2>Say hello</h2>
            <Link to="/contact">Contact the team <ArrowUpRight size={15} /></Link>
            <a href="mailto:aerospace@gmail.com">aerospace@gmail.com</a>
            <div className="social-links" aria-label="Social links">
              <a href="https://www.linkedin.com/" aria-label="LinkedIn">
                <Linkedin size={17} />
              </a>
              <a className="social-link-telegram" href="https://telegram.org/" aria-label="Telegram">
                <Send size={16} />
              </a>
              <a className="social-link-twitter" href="https://x.com/" aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.4l-5.8-7.6-6.7 7.6H.4L9 13 .1 1.2h7.6l5.2 6.9zm-1.3 19.6h2L6.5 3.1h-2.2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AeroCampus. Learning has no limit.</span>
          <span>Built for curious minds, wherever they are.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
