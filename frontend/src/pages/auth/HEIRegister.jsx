import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerHEI } from '../../api/universities'
import { getDistricts } from '../../api/master'

export default function HEIRegister() {
  const navigate = useNavigate()
  const [districts, setDistricts] = useState([])
  
  const [form, setForm] = useState({
    name: '',
    institution_type: 'State University',
    registration_id: '',
    address: '',
    district: '',
    state: 'Jharkhand',
    website: '',
    first_name: '',
    last_name: '',
    designation: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    passwordConfirm: '',
    departments: '',
    facilities: '',
  })
  const [file, setFile] = useState(null)
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getDistricts().then(res => setDistricts(res.data.results || res.data)).catch(console.error)
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    if (form.password !== form.passwordConfirm) {
      setErrors({ passwordConfirm: 'Passwords do not match' })
      return
    }

    setLoading(true)
    const formData = new FormData()
    Object.keys(form).forEach(key => {
      if (key !== 'passwordConfirm') {
        formData.append(key, form[key])
      }
    })
    if (file) {
      formData.append('verification_document', file)
    }

    try {
      await registerHEI(formData)
      setSuccess(true)
    } catch (err) {
      if (err.response?.data) {
        setErrors(typeof err.response.data === 'object' ? err.response.data : { non_field_errors: ['Registration failed.'] })
      } else {
        setErrors({ non_field_errors: ['Network error. Please try again.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 600, textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏫</div>
          <h1 className="auth-form-title">Application Submitted</h1>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
            Thank you for registering <strong>{form.name}</strong> on the SAMAdhanX portal.<br/><br/>
            Your application is currently <strong style={{ color: 'var(--color-warning)' }}>Pending Verification</strong> by the Government Administration. 
            Once approved, your HEI SPOC account will be activated and you will be able to log in and access the dashboard.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page" style={{ padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: 800 }}>
        <div className="auth-brand">
          <div className="auth-brand-logo">S</div>
          <div className="auth-brand-name">SamadhanX</div>
        </div>

        <h1 className="auth-form-title">University / HEI Registration</h1>
        <p className="auth-form-sub" style={{ marginBottom: 24 }}>
          Register your institution to receive civic challenges, form student teams, and collaborate with industry.
        </p>

        {errors.non_field_errors && (
          <div className="alert alert-error" role="alert">{errors.non_field_errors[0]}</div>
        )}
        {errors.detail && (
          <div className="alert alert-error" role="alert">{errors.detail}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gray-800)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            1. Institution Details
          </h3>
          
          <div className="form-group">
            <label className="form-label">Institution Name <span className="required">*</span></label>
            <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Institution Type <span className="required">*</span></label>
              <select name="institution_type" className="form-control" value={form.institution_type} onChange={handleChange}>
                <option value="Central University">Central University</option>
                <option value="State University">State University</option>
                <option value="Deemed University">Deemed University</option>
                <option value="Private University">Private University</option>
                <option value="Autonomous College">Autonomous College</option>
                <option value="Engineering College">Engineering College</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Registration / AISHE Code</label>
              <input name="registration_id" className="form-control" value={form.registration_id} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Address <span className="required">*</span></label>
            <textarea name="address" className="form-control" rows={2} value={form.address} onChange={handleChange} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">District <span className="required">*</span></label>
              <select name="district" className="form-control" value={form.district} onChange={handleChange} required>
                <option value="">Select District</option>
                {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input name="state" className="form-control" value={form.state} disabled />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Institution Website</label>
            <input type="url" name="website" className="form-control" value={form.website} onChange={handleChange} placeholder="https://" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Departments / Disciplines</label>
              <textarea name="departments" className="form-control" rows={2} value={form.departments} onChange={handleChange} placeholder="e.g., Computer Science, Mechanical, IoT" />
            </div>
            <div className="form-group">
              <label className="form-label">Incubation / R&amp;D Facilities</label>
              <textarea name="facilities" className="form-control" rows={2} value={form.facilities} onChange={handleChange} placeholder="e.g., Fabrication Lab, AI Research Center" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Verification Document (PDF) <span className="required">*</span></label>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Upload official authorization letter from VC/Director appointing the SPOC.</div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-control" onChange={e => setFile(e.target.files[0])} required />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 32, color: 'var(--gray-800)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            2. SPOC (Authorized Contact) Details
          </h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">First Name <span className="required">*</span></label>
              <input name="first_name" className="form-control" value={form.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name <span className="required">*</span></label>
              <input name="last_name" className="form-control" value={form.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Designation <span className="required">*</span></label>
              <input name="designation" className="form-control" value={form.designation} onChange={handleChange} placeholder="e.g., Dean of Research" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number <span className="required">*</span></label>
              <input name="phone" type="tel" className="form-control" value={form.phone} onChange={handleChange} required />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 32, color: 'var(--gray-800)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            3. Account Credentials
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <input name="username" className={`form-control${errors.username ? ' is-invalid' : ''}`} value={form.username} onChange={handleChange} required />
              {errors.username && <div className="form-error">{errors.username[0]}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Official Email <span className="required">*</span></label>
              <input name="email" type="email" className={`form-control${errors.email ? ' is-invalid' : ''}`} value={form.email} onChange={handleChange} required />
              {errors.email && <div className="form-error">{errors.email[0]}</div>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password <span className="required">*</span></label>
              <input name="passwordConfirm" type="password" className={`form-control${errors.passwordConfirm ? ' is-invalid' : ''}`} value={form.passwordConfirm} onChange={handleChange} required />
              {errors.passwordConfirm && <div className="form-error">{errors.passwordConfirm}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: 24 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Submitting Application...</> : 'Submit Registration Application'}
          </button>
        </form>

        <div className="auth-link">
          Already verified? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
