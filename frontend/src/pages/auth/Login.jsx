import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_REDIRECTS = {
  citizen: '/citizen/my-challenges',
  gov_admin: '/admin/dashboard',
  hei_spoc: '/hei/assigned-challenges',
  faculty_mentor: '/faculty/my-teams',
  industry_partner: '/industry/browse-projects',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      navigate(ROLE_REDIRECTS[user.role] || '/citizen/my-challenges')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">S</div>
          <div className="auth-brand-name">SamadhanX</div>
          <div className="auth-brand-sub">Societal Innovation Collaboration Portal · SIH 26043</div>
        </div>

        <h1 className="auth-form-title">Sign In</h1>
        <p className="auth-form-sub">
          Enter your credentials to access the platform.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">
              Username <span className="required">*</span>
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

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? <><span className="spinner spinner-sm" /> Signing In...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account?{' '}
          <Link to="/register">Create Account</Link>
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 12, color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
          <strong>Demo Credentials</strong><br />
          Admin: <code>admin / Demo@1234</code><br />
          Citizen: <code>citizen1 / Demo@1234</code><br />
          HEI: <code>hei_spoc1 / Demo@1234</code><br />
          Faculty: <code>faculty1 / Demo@1234</code><br />
          Industry: <code>industry1 / Demo@1234</code>
        </div>
      </div>
    </div>
  )
}
