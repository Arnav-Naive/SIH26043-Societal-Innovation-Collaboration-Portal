import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import { getChallengeDetail } from '../../api/challenges'
import { formTeam, getFaculties } from '../../api/universities'

export default function FormTeam() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const [form, setForm] = useState({
    faculty_mentor_id: '',
    project_title: '',
    objective: '',
    domain: '',
    project_description: '',
    students: [''],
  })

  useEffect(() => {
    Promise.all([
      getChallengeDetail(id),
      getFaculties(),
    ])
      .then(([chRes, facRes]) => {
        setChallenge(chRes.data)
        setFaculties(Array.isArray(facRes.data) ? facRes.data : facRes.data.results || [])
      })
      .catch(() => setError('Unable to load data.'))
      .finally(() => setLoading(false))
  }, [id])

  const addStudent = () => setForm(f => ({ ...f, students: [...f.students, ''] }))
  const removeStudent = (i) => setForm(f => ({ ...f, students: f.students.filter((_, idx) => idx !== i) }))
  const updateStudent = (i, val) => setForm(f => ({ ...f, students: f.students.map((s, idx) => idx === i ? val : s) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const students = form.students.filter(s => s.trim())
    if (students.length === 0) { setError('Add at least one student.'); return }

    setSubmitting(true)
    try {
      const payload = {
        faculty_mentor_id: form.faculty_mentor_id || null,
        project_title: form.project_title,
        objective: form.objective,
        domain: form.domain,
        project_description: form.project_description,
        students,
      }
      const { data } = await formTeam(id, payload)
      setSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Team formation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div><TopHeader title="Form Team" /><div className="page-content"><LoadingPage /></div></div>
  )

  if (success) {
    return (
      <div><TopHeader title="Team Created" />
        <div className="page-content">
          <div className="confirmation-card" style={{ margin: '40px auto', maxWidth: 500 }}>
            <div className="confirmation-icon">✓</div>
            <div className="confirmation-title">Project Team Created</div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
              The team has been formed for <strong>{challenge?.title}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => navigate('/hei/my-teams')}>View My Teams</button>
              <button className="btn btn-secondary" onClick={() => navigate('/hei/assigned-challenges')}>Back</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopHeader title="Form Project Team" />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="page-header">
          <h1 className="page-title">Form Project Team</h1>
        </div>

        {challenge && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ padding: '14px 18px' }}>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 6 }}>{challenge.title}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge value={challenge.priority} />
                {challenge.category && <span className="tag">{challenge.category}</span>}
                <span className="tag">📍 {challenge.district}</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="ft-faculty">Faculty Mentor</label>
                <select
                  id="ft-faculty"
                  className="form-control"
                  value={form.faculty_mentor_id}
                  onChange={e => setForm(f => ({ ...f, faculty_mentor_id: e.target.value }))}
                >
                  <option value="">Select faculty mentor (optional)</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} {f.organization ? `— ${f.organization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ft-title">Project Title</label>
                <input
                  type="text"
                  id="ft-title"
                  className="form-control"
                  value={form.project_title}
                  onChange={e => setForm(f => ({ ...f, project_title: e.target.value }))}
                  placeholder="E.g., Smart Water Monitoring System"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ft-domain">Domain / Technology Focus</label>
                <input
                  type="text"
                  id="ft-domain"
                  className="form-control"
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="E.g., IoT, AI/ML, CleanTech"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ft-objective">Primary Objective</label>
                <textarea
                  id="ft-objective"
                  className="form-control"
                  rows={2}
                  value={form.objective}
                  onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                  placeholder="What is the main goal of this project?"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ft-desc">Solution Approach / Description</label>
                <textarea
                  id="ft-desc"
                  className="form-control"
                  rows={4}
                  value={form.project_description}
                  onChange={e => setForm(f => ({ ...f, project_description: e.target.value }))}
                  placeholder="Describe the proposed technical approach and methodology..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Student Members <span className="required">*</span>
                </label>
                {form.students.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      className="form-control"
                      value={s}
                      onChange={e => updateStudent(i, e.target.value)}
                      placeholder={`Student ${i + 1} name (e.g. Arjun Kumar — BIT/Civil/2023)`}
                    />
                    {form.students.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeStudent(i)}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStudent}>
                  + Add Student
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner spinner-sm" /> Creating...</> : 'Create Team'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
