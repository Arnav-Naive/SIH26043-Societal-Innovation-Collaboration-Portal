import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_REDIRECTS = {
  citizen: '/citizen/my-challenges',
  gov_admin: '/admin/dashboard',
  hei_spoc: '/hei/assigned-challenges',
  faculty_mentor: '/faculty/my-teams',
  industry_partner: '/industry/browse-projects',
}

const ROLE_OPTIONS = [
  { value: 'citizen', label: 'Citizen — Report a local problem' },
  { value: 'hei_spoc', label: 'HEI SPOC — University representative' },
  { value: 'faculty_mentor', label: 'Faculty Mentor — Guide student teams' },
  { value: 'industry_partner', label: 'Industry Partner — Support projects' },
  { value: 'gov_admin', label: 'Government Administrator' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: '', role: 'citizen',
    phone: '', district: '', organization: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const user = await register(form)
      const nextUrl = searchParams.get('next')
      if (nextUrl) {
        navigate(nextUrl)
      } else {
        navigate(ROLE_REDIRECTS[user.role] || '/citizen/my-challenges')
      }
    } catch (err) {
      if (err.response?.data) {
        const apiErrors = err.response.data
        if (typeof apiErrors === 'object') {
          setErrors(apiErrors)
        } else {
          setErrors({ non_field_errors: ['Registration failed. Please try again.'] })
        }
      } else {
        setErrors({ non_field_errors: ['Network error. Please try again.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, type = 'text', required = false) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`reg-${name}`}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={`reg-${name}`}
        name={name}
        type={type}
        className={`form-control${errors[name] ? ' is-invalid' : ''}`}
        value={form[name]}
        onChange={handleChange}
        required={required}
      />
      {errors[name] && (
        <div className="form-error">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</div>
      )}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-brand">
          <div className="auth-brand-logo">S</div>
          <div className="auth-brand-name">SamadhanX</div>
          <div className="auth-brand-sub">Societal Innovation Collaboration Portal</div>
        </div>

        <h1 className="auth-form-title">Create Account</h1>
        <p className="auth-form-sub">Register to participate in India's civic innovation platform.</p>

        {errors.non_field_errors && (
          <div className="alert alert-error" role="alert">{errors.non_field_errors[0]}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid-2">
            {field('first_name', 'First Name', 'text', true)}
            {field('last_name', 'Last Name', 'text', true)}
          </div>

          {field('username', 'Username', 'text', true)}
          {field('email', 'Email Address', 'email', true)}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">
              Role <span className="required">*</span>
            </label>
            <select
              id="reg-role"
              name="role"
              className="form-control"
              value={form.role}
              onChange={(e) => {
                if (e.target.value === 'hei_spoc') {
                  navigate('/register-hei')
                } else {
                  handleChange(e)
                }
              }}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {field('phone', 'Phone Number')}
          {field('district', 'District / City')}
          {field('organization', 'Organization / Institution')}

          <div className="divider" />

          {field('password', 'Password', 'password', true)}
          {field('password2', 'Confirm Password', 'password', true)}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
