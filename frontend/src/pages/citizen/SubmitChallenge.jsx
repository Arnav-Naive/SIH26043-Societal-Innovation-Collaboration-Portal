import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import { submitChallenge } from '../../api/challenges'
import { getMasterData } from '../../api/master'
import StatusBadge from '../../components/common/StatusBadge'

export default function SubmitChallenge() {
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [districts, setDistricts] = useState([])
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

  useEffect(() => {
    getMasterData('districts')
      .then(({ data }) => setDistricts(Array.isArray(data) ? data : data.results || []))
      .catch(() => setDistricts([]))
  }, [])

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

  const [step, setStep] = useState(1)

  const handleNext = () => {
    const e = {}
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Problem title is required.'
      if (!form.description.trim()) e.description = 'Description is required.'
      if (form.description.trim().length < 30) e.description = 'Please describe the problem in at least 30 characters.'
    } else if (step === 2) {
      if (!form.district) e.district = 'Please select a district.'
    }
    
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    
    setErrors({})
    setStep(s => Math.min(s + 1, 4))
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
    setErrors({})
  }

  const handleSubmit = async () => {
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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/citizen/challenges/${submitted.id}`)}
              style={{ padding: '12px 24px', fontSize: 16 }}
            >
              Track My Problem
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/citizen/my-challenges')}
              style={{ padding: '12px 24px', fontSize: 16 }}
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
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="page-header" style={{ width: '100%', maxWidth: 680, textAlign: 'center' }}>
          <h1 className="page-title">Report a Societal Problem</h1>
          <p className="page-subtitle">
            Share a local problem that could benefit from research, innovation or community action.
          </p>
        </div>

        {/* Wizard Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 680, marginBottom: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 15, left: 20, right: 20, height: 2, background: 'var(--gray-200)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 15, left: 20, width: `${((step - 1) / 3) * 100}%`, height: 2, background: 'var(--color-primary)', zIndex: 0, transition: 'width 0.3s ease' }} />
          
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: step >= s ? 'var(--color-primary)' : '#fff',
                border: step >= s ? '2px solid var(--color-primary)' : '2px solid var(--gray-300)',
                color: step >= s ? '#fff' : 'var(--gray-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                transition: 'all 0.3s ease'
              }}>
                {s}
              </div>
              <div className="desktop-only" style={{ fontSize: 12, fontWeight: step >= s ? 600 : 500, color: step >= s ? 'var(--color-primary)' : 'var(--gray-500)' }}>
                {s === 1 ? 'Describe' : s === 2 ? 'Location' : s === 3 ? 'Evidence' : 'Review'}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ width: '100%', maxWidth: 680 }}>
          <div className="card-body" style={{ padding: '32px' }}>
            {errors.non_field_errors && (
              <div className="alert alert-error">{errors.non_field_errors}</div>
            )}

            {/* STEP 1: DESCRIBE */}
            {step === 1 && (
              <div className="wizard-step animation-fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--gray-900)' }}>Step 1: Describe Your Problem</h2>
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
                  />
                  {errors.title && <div className="form-error">{errors.title}</div>}
                </div>
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
                    rows={6}
                    placeholder="Describe the problem in detail — who is affected, what is happening, and why it needs attention."
                  />
                  {errors.description && <div className="form-error">{errors.description}</div>}
                  <div className="form-hint">
                    More detail helps our AI system categorize and prioritize your problem accurately. ({form.description.length} chars)
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <div className="wizard-step animation-fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--gray-900)' }}>Step 2: Location</h2>
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
                  >
                    <option value="">Select district</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.district && <div className="form-error">{errors.district}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sc-location">
                    Specific Location (Optional)
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
              </div>
            )}

            {/* STEP 3: EVIDENCE */}
            {step === 3 && (
              <div className="wizard-step animation-fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--gray-900)' }}>Step 3: Add Evidence</h2>
                <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 24 }}>Adding photos or documents helps verify the problem faster.</p>
                
                <div className="form-group">
                  <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload photos"
                    style={{ padding: '40px 20px', background: 'var(--gray-50)', border: '2px dashed var(--gray-300)' }}
                  >
                    <div className="upload-zone-icon" style={{ fontSize: 32 }}>📷</div>
                    <div className="upload-zone-text" style={{ fontSize: 16 }}>
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
                    <div className="upload-preview-list" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                      {previews.map((p, i) => (
                        <div key={i} className="upload-preview-item" style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1/1' }}>
                          {p.src.startsWith('data:image') ? (
                            <img src={p.src} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', fontSize: 32, height: '100%' }}>📄</div>
                          )}
                          <button
                            type="button"
                            className="upload-preview-remove"
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <div className="wizard-step animation-fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--gray-900)' }}>Step 4: Review & Submit</h2>
                
                <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Title</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>{form.title}</div>
                    </div>
                    <button className="btn-ghost" style={{ padding: 4, color: 'var(--color-primary)' }} onClick={() => setStep(1)}>Edit</button>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
                    <div style={{ fontSize: 14, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{form.description}</div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
                      <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                        {districts.find(d => String(d.id) === String(form.district))?.name} 
                        {form.location ? ` - ${form.location}` : ''}
                      </div>
                    </div>
                    <button className="btn-ghost" style={{ padding: 4, color: 'var(--color-primary)' }} onClick={() => setStep(2)}>Edit</button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Evidence ({files.length} files)</div>
                      <button className="btn-ghost" style={{ padding: 4, color: 'var(--color-primary)' }} onClick={() => setStep(3)}>Edit</button>
                    </div>
                    {files.length === 0 && <div style={{ fontSize: 14, color: 'var(--gray-500)', fontStyle: 'italic' }}>No files attached</div>}
                  </div>
                </div>

                <div style={{ marginTop: 24, padding: 16, background: 'var(--color-primary-light)', borderRadius: 8, color: 'var(--color-primary-dark)', fontSize: 13, lineHeight: 1.5 }}>
                  <strong>What happens next?</strong> Once submitted, our AI engine will categorize your problem and it will be sent to the government authorities for verification and matching with a University team.
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
              {step > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={loading} style={{ padding: '12px 24px' }}>
                  Back
                </button>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/citizen/dashboard')} disabled={loading}>
                  Cancel
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ padding: '12px 32px' }}>
                  Next
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 32px' }}>
                  {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : 'Submit Problem'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
