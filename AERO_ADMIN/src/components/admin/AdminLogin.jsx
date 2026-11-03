import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/aerocampus-logo.svg'
import { adminRequest } from '../../utils/adminApi.js'

const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173'

function AdminLogin() {
  const navigate = useNavigate()
  const [theme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('aerocampus-admin-theme')
      || localStorage.getItem('aerocampus-site-theme')
      || 'light'
  })
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    adminRequest('/auth/me')
      .then(({ data }) => {
        if (active) navigate(data.mustChangePassword ? '/admin/change-password' : '/admin/dashboard', { replace: true })
      })
        .catch((requestError) => {
          if (active && requestError.status !== 401) {
            toast.error(requestError.message || 'Unable to check the administrator session.')
          }
        })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => { active = false }
  }, [])

  if (checking) {
    return (
      <div className={`admin-app admin-theme-${theme}`}>
        <main className="admin-login-page"><p className="admin-login-loading">Checking administrator session…</p></main>
      </div>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const { data } = await adminRequest('/auth/login', {
        method: 'POST',
        body: form,
      })
      if (data.user.mustChangePassword) {
        toast.success('Set a new password to finish signing in.')
        navigate('/admin/change-password', { replace: true })
      } else {
        toast.success('Signed in successfully.')
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (requestError) {
      const message = requestError.message || 'Sign-in failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`admin-app admin-theme-${theme}`}>
      <main className="admin-login-page">
        <a className="admin-login-back" href={publicSiteUrl}><ArrowLeft size={16} /> Back to AeroCampus</a>
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <a className="admin-login-brand" href={publicSiteUrl}>
            <img src={logo} alt="AeroCampus logo" />
          </a>
          <span className="admin-eyebrow">Administrator access</span>
          <h1 id="admin-login-title">Welcome back.</h1>
          <p className="admin-login-subtitle">Sign in to manage your aerospace stories.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                autoComplete="username"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                maxLength={254}
                autoFocus
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                maxLength={200}
              />
            </label>
            <button className="admin-primary-button admin-login-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="admin-login-footnote">Administrator accounts.</p>
        </section>
      </main>
    </div>
  )
}

export default AdminLogin
