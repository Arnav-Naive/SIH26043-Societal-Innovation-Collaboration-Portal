import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import { submitChallenge } from '../../api/challenges'
import StatusBadge from '../../components/common/StatusBadge'

const DISTRICTS = [
  'Ranchi', 'Dhanbad', 'Bokaro', 'Jamshedpur (East Singhbhum)',
  'Seraikela-Kharsawan', 'West Singhbhum', 'Giridih', 'Hazaribagh',
  'Chatra', 'Koderma', 'Lohardaga', 'Gumla', 'Simdega', 'Khunti',
  'Ramgarh', 'Palamu', 'Latehar', 'Garhwa', 'Sahibganj', 'Pakur',
  'Godda', 'Dumka', 'Deoghar', 'Jamtara', 'Other',
]

export default function SubmitChallenge() {
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    title: '',
    description: '',
    district: '',
    location: '',
  })
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, { src: ev.target.result, name: f.name }])
      reader.readAsDataURL(f)
    })
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Problem title is required.'
    if (!form.description.trim()) e.description = 'Description is required.'
    if (form.description.trim().length < 30) e.description = 'Please describe the problem in at least 30 characters.'
    if (!form.district) e.district = 'Please select a district.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      files.forEach(f => formData.append('media', f))
      const { data } = await submitChallenge(formData)
      setSubmitted(data)
    } catch (err) {
      const apiErrors = err.response?.data || {}
      if (typeof apiErrors === 'object') setErrors(apiErrors)
      else setErrors({ non_field_errors: 'Submission failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <div className="confirmation-icon">✓</div>
          <div className="confirmation-title">Problem Submitted Successfully</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 0 }}>
            Your problem has been recorded. Our team will review it shortly.
          </p>
          <div className="confirmation-ref">{submitted.reference_id}</div>
          <div className="confirmation-details">
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span><StatusBadge value={submitted.status} /></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <span className="detail-value">{submitted.category}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Confidence</span>
              <span className="detail-value">{submitted.category_confidence}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Priority</span>
              <span><StatusBadge value={submitted.priority} /></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">District</span>
              <span className="detail-value">{submitted.district}</span>
            </div>
          </div>
          {submitted.category_reason && (
            <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 20 }}>
              <strong>Classification:</strong> {submitted.category_reason}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/citizen/challenges/${submitted.id}`)}
            >
              Track My Problem
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/citizen/my-challenges')}
            >
              My Problems
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopHeader title="Submit a Problem" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Report a Societal Problem</h1>
          <p className="page-subtitle">
            Share a local problem that could benefit from research, innovation or community action.
          </p>
        </div>

        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-body">
            {errors.non_field_errors && (
              <div className="alert alert-error">{errors.non_field_errors}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* 1. Problem Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="sc-title">
                  Problem Title <span className="required">*</span>
                </label>
                <input
                  id="sc-title"
                  name="title"
                  type="text"
                  className={`form-control${errors.title ? ' is-invalid' : ''}`}
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Briefly describe the problem in one sentence"
                  required
                />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>

              {/* 2. Describe the Problem */}
              <div className="form-group">
                <label className="form-label" htmlFor="sc-description">
                  Describe the Problem <span className="required">*</span>
                </label>
                <textarea
                  id="sc-description"
                  name="description"
                  className={`form-control${errors.description ? ' is-invalid' : ''}`}
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the problem in detail — who is affected, what is happening, and why it needs attention."
                  required
                />
                {errors.description && <div className="form-error">{errors.description}</div>}
                <div className="form-hint">
                  More detail helps our system categorize and prioritize your problem accurately.
                </div>
              </div>

              {/* 3. District */}
              <div className="form-group">
                <label className="form-label" htmlFor="sc-district">
                  District <span className="required">*</span>
                </label>
                <select
                  id="sc-district"
                  name="district"
                  className={`form-control${errors.district ? ' is-invalid' : ''}`}
                  value={form.district}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <div className="form-error">{errors.district}</div>}
              </div>

              {/* 4. Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="sc-location">
                  Specific Location
                </label>
                <input
                  id="sc-location"
                  name="location"
                  type="text"
                  className="form-control"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Village, block, ward or landmark"
                />
              </div>

              {/* 5. Evidence / Photos */}
              <div className="form-group">
                <label className="form-label">Add Photos or Evidence</label>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload photos"
                >
                  <div className="upload-zone-icon">📷</div>
                  <div className="upload-zone-text">
                    <strong>Tap to add photos</strong> or drag &amp; drop
                  </div>
                  <div className="upload-zone-hint">
                    JPG, PNG, PDF · Max 10 files
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {previews.length > 0 && (
                  <div className="upload-preview-list">
                    {previews.map((p, i) => (
                      <div key={i} className="upload-preview-item">
                        {p.src.startsWith('data:image') ? (
                          <img src={p.src} alt={p.name} className="upload-preview-img" />
                        ) : (
                          <div className="upload-preview-img" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--gray-100)', fontSize: 24,
                          }}>📄</div>
                        )}
                        <button
                          type="button"
                          className="upload-preview-remove"
                          onClick={() => removeFile(i)}
                          aria-label={`Remove ${p.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : 'Submit Problem'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate('/citizen/my-challenges')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
