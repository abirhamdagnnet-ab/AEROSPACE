import { useEffect, useState } from 'react'
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MoonStar,
  Plus,
  SunMedium,
  Tags,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/aerocampus-logo.svg'
import { adminRequest, setCsrfToken } from '../../utils/adminApi.js'

const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173'

const navigation = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/articles', label: 'Articles', icon: BookOpenText },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/messages', label: 'Contact messages', icon: Mail },
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('aerocampus-admin-theme') || 'light'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocampus-admin-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    let active = true
    adminRequest('/auth/me')
      .then(({ data }) => {
        if (!active) return
        if (data.mustChangePassword) {
          navigate('/admin/change-password', { replace: true })
          return
        }
        setUser(data.user)
      })
      .catch((requestError) => {
        if (active && requestError.status === 401) navigate('/admin/login', { replace: true })
        else if (active) {
          toast.error(requestError.message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  async function logout() {
    setSigningOut(true)
    try {
      await adminRequest('/auth/logout', { method: 'POST', csrf: true })
      setCsrfToken('')
      toast.success('Signed out successfully.')
      navigate('/admin/login', { replace: true })
    } catch (requestError) {
      const message = requestError.message || 'Unable to sign out right now.'
      toast.error(message)
      setSigningOut(false)
    }
  }

  if (loading) {
    return <main className="admin-loading"><span className="admin-spinner" /> Verifying administrator session…</main>
  }
  if (!user) {
    return (
      <main className="admin-loading">
        <Link to="/admin/login">Go to sign in</Link>
      </main>
    )
  }

  return (
    <div className={`admin-app admin-theme-${theme}`}>
      {sidebarOpen && <button className="admin-mobile-overlay" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <Link className="admin-brand" to="/admin">
            <img src={logo} alt="AeroCampus" />
          </Link>
          <button className="admin-icon-button admin-mobile-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
              <Icon size={17} /> <span>{label}</span>
              {label === 'Articles' && <ChevronRight className="admin-nav-trailing" size={15} />}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-spacer" />
        <button
          type="button"
          className="admin-theme-toggle"
          onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <MoonStar size={15} /> : <SunMedium size={15} />}
        </button>
        <a className="admin-back-to-site" href={publicSiteUrl}><ChevronLeft size={15} /> View public website</a>
        <div className="admin-user">
          <span className="admin-avatar" aria-hidden="true">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
          <span className="admin-user-copy"><strong>{user.name}</strong><small>Administrator</small></span>
          <button className="admin-icon-button admin-logout" type="button" onClick={logout} disabled={signingOut} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="admin-main-column">
        <header className="admin-topbar">
          <button className="admin-icon-button admin-mobile-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="admin-topbar-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{navigation.find((item) => item.to === location.pathname)?.label || (location.pathname.includes('/categories') ? 'Categories' : location.pathname.includes('/messages') || location.pathname.includes('/contacts') ? 'Contact messages' : location.pathname.includes('/articles') ? 'Articles' : 'Overview')}</strong></div>
          <a className="admin-view-site" href={publicSiteUrl} target="_blank" rel="noreferrer">View website <ChevronRight size={14} /></a>
        </header>
        <main className="admin-content">
          <Outlet context={{ user }} />
        </main>
      </div>
      {!location.pathname.includes('/articles/new') && !location.pathname.endsWith('/edit') && (
        <Link className="admin-fab" to="/admin/articles/new" aria-label="Create article"><Plus size={22} /></Link>
      )}
    </div>
  )
}

export default AdminLayout
