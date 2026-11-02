import { useEffect, useState } from 'react'
import { MoonStar, Menu, SunMedium, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import logo from '../../assets/aerocampus-logo.svg'

const links = [
  { to: '/aerospace-engineering', label: 'Aerospace Engineering' },
  { to: '/articles', label: 'Articles' },
  { to: '/about', label: 'About' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('aerocampus-site-theme') || 'light'
  })

  useEffect(() => {
    document.body.dataset.theme = theme
    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocampus-site-theme', theme)
    }
  }, [theme])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="AeroCampus home" onClick={closeMenu}>
          <img className="brand-logo" src={logo} alt="AeroCampus logo" />
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <nav
          className={`primary-navigation${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          <div className="nav-links">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <MoonStar size={16} /> : <SunMedium size={16} />}
            </button>
            <Link className="button button-small button-primary nav-contact" to="/contact" onClick={closeMenu}>
              Get in touch
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
