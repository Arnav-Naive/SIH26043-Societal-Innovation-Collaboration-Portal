import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_REDIRECTS = {
  citizen: '/citizen/dashboard',
  gov_admin: '/admin/dashboard',
  hei_spoc: '/hei/dashboard',
  faculty_mentor: '/faculty/my-teams',
  industry_partner: '/industry/dashboard',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      const nextUrl = searchParams.get('next')
      if (nextUrl) {
        navigate(nextUrl)
      } else {
        navigate(ROLE_REDIRECTS[user.role] || '/citizen/my-challenges')
      }
    } catch (err) {
      // Extract error message from DRF response (multiple possible formats)
      const data = err.response?.data
      const msg =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        (typeof data === 'string' ? data : null) ||
        (err.response ? `Login failed (${err.response.status}). Please check your credentials.` : null) ||
        'Unable to connect to the server. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-auth-container">
      {/* Left Visual Panel */}
      <div className="auth-visual-panel">
        <div className="auth-visual-content">
          <div className="auth-visual-title">
            People.<br />
            Problems.<br />
            Possibilities.
          </div>
          <div className="auth-visual-subtitle">
            Together for a better Jharkhand.
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">

        <div className="auth-card">
          <div className="auth-brand" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <img src="/images/logo.png" alt="SamadhanX Logo" style={{ width: '100%', maxWidth: '240px', objectFit: 'contain' }} />
          </div>

          <h1 className="auth-form-title">Welcome Back</h1>
          <p className="auth-form-sub">
            Login to continue your journey with SamadhanX
          </p>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                Username or Email <span className="required">*</span>
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                className="form-control"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13px', color: '#4B5563' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#0F5132' }} />
                Remember me
              </label>
              <a href="#" style={{ color: '#0F5132', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading ? <><span className="spinner spinner-sm" /> Signing In...</> : 'Sign In →'}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account?{' '}
            <Link to="/register">Create Account</Link>
          </div>

          <div className="demo-credentials">
            <strong>Demo Credentials</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
              <span>Admin: <code>admin / Demo@1234</code></span>
              <span>Citizen: <code>citizen1 / Demo@1234</code></span>
              <span>HEI: <code>hei_spoc1 / Demo@1234</code></span>
              <span>Faculty: <code>faculty1 / Demo@1234</code></span>
              <span>Industry: <code>industry1 / Demo@1234</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
