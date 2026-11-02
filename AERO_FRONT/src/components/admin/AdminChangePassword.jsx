import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/aerocampus-logo.svg'
import { adminRequest, setCsrfToken } from '../../utils/adminApi.js'

function AdminChangePassword() {
  const navigate = useNavigate()
  const [theme] = useState(() => localStorage.getItem('aerocampus-admin-theme') || 'light')
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    let active = true
    adminRequest('/auth/me')
      .then(({ data }) => {
        if (active && !data.mustChangePassword) navigate('/admin', { replace: true })
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) navigate('/admin/login', { replace: true })
        else toast.error(requestError.message || 'Unable to verify your administrator session.')
      })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.newPassword.length < 14 || form.newPassword.length > 200) {
      toast.error('Your new password must be between 14 and 200 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('The new passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await adminRequest('/auth/password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
        csrf: true,
      })
      setCsrfToken('')
      toast.success('Password changed. You can now continue to the admin workspace.')
      navigate('/admin', { replace: true })
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to change your password.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    try {
      await adminRequest('/auth/logout', { method: 'POST', csrf: true })
      setCsrfToken('')
      navigate('/admin/login', { replace: true })
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to sign out.')
    }
  }

  if (checking) {
    return <main className="admin-loading"><span className="admin-spinner" /> Verifying administrator session…</main>
  }

  return (
    <div className={`admin-app admin-theme-${theme}`}>
      <main className="admin-login-page">
        <Link className="admin-login-back" to="/"><ArrowLeft size={16} /> Back to AeroCampus</Link>
        <section className="admin-login-card" aria-labelledby="password-change-title">
          <Link className="admin-login-brand" to="/">
            <img src={logo} alt="AeroCampus logo" />
          </Link>
          <span className="admin-eyebrow">SECURE YOUR ACCOUNT</span>
          <h1 id="password-change-title">Change your password.</h1>
          <p className="admin-login-subtitle">Set a new password before continuing to the administrator workspace.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Current password
              <input
                autoComplete="current-password"
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                required
                maxLength={200}
              />
            </label>
            <label>
              New password
              <input
                autoComplete="new-password"
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                required
                minLength={14}
                maxLength={200}
              />
            </label>
            <label>
              Confirm new password
              <input
                autoComplete="new-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                required
                minLength={14}
                maxLength={200}
              />
            </label>
            <button className="admin-primary-button admin-login-submit" type="submit" disabled={saving}>
              {saving ? 'Changing password…' : 'Change password'}
            </button>
            <button className="admin-side-draft" type="button" onClick={signOut} disabled={saving}>
              Sign out instead
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default AdminChangePassword
