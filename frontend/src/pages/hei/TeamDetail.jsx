import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import { getTeamDetail } from '../../api/universities'
import { getTeamMilestones, createMilestone, submitMilestone } from '../../api/projects'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '' })
  const [milestoneError, setMilestoneError] = useState('')
  const [milestoneLoading, setMilestoneLoading] = useState(false)

  const loadData = async () => {
    try {
      const [teamRes, msRes] = await Promise.all([
        getTeamDetail(id),
        getTeamMilestones(id),
      ])
      setTeam(teamRes.data)
      setMilestones(Array.isArray(msRes.data) ? msRes.data : msRes.data.results || [])
    } catch {
      setError('Unable to load team details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleCreateMilestone = async (e) => {
    e.preventDefault()
    setMilestoneError('')
    if (!milestoneForm.title.trim() || !milestoneForm.due_date) {
      setMilestoneError('Title and due date are required.')
      return
    }
    setMilestoneLoading(true)
    try {
      await createMilestone(id, milestoneForm)
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', due_date: '' })
      loadData()
    } catch (err) {
      setMilestoneError(err.response?.data?.detail || 'Failed to create milestone.')
    } finally {
      setMilestoneLoading(false)
    }
  }

  const handleSubmitMilestone = async (msId) => {
    try {
      await submitMilestone(msId, new FormData())
      loadData()
    } catch {
      alert('Failed to submit milestone.')
    }
  }

  if (loading) return (
    <div><TopHeader title="Team Detail" /><div className="page-content"><LoadingPage /></div></div>
  )

  if (error || !team) return (
    <div><TopHeader title="Team Detail" />
      <div className="page-content">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )

  return (
    <div>
      <TopHeader title="Project Team" />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="page-header">
          <h1 className="page-title">{team.challenge?.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <StatusBadge value={team.challenge?.priority} />
            <StatusBadge value={team.challenge?.status} />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Team Details</span></div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">University</span>
                <span className="detail-value">{team.university?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Faculty Mentor</span>
                <span className="detail-value">
                  {team.faculty_mentor
                    ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                    : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned</span>}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stage</span>
                <span className="detail-value">{team.stage}</span>
              </div>
              <div className="detail-section-title" style={{ marginTop: 16 }}>Students</div>
              {team.students?.length > 0 ? (
                <ul style={{ paddingLeft: 16 }}>
                  {team.students.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--gray-700)', marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No students added</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Project Description</span></div>
            <div className="card-body">
              {team.project_description ? (
                <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {team.project_description}
                </p>
              ) : (
                <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 13 }}>No description provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Milestones ({milestones.length})</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
              + Add Milestone
            </button>
          </div>
          <div className="card-body">
            {showMilestoneForm && (
              <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid var(--border-color)' }}>
                <div className="section-heading">New Milestone</div>
                {milestoneError && <div className="alert alert-error">{milestoneError}</div>}
                <form onSubmit={handleCreateMilestone}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ms-title">Title <span className="required">*</span></label>
                    <input id="ms-title" className="form-control" value={milestoneForm.title}
                      onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Milestone title" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ms-desc">Description</label>
                    <textarea id="ms-desc" className="form-control" rows={3} value={milestoneForm.description}
                      onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ms-date">Due Date <span className="required">*</span></label>
                    <input id="ms-date" type="date" className="form-control" value={milestoneForm.due_date}
                      onChange={e => setMilestoneForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={milestoneLoading}>
                      {milestoneLoading ? 'Saving...' : 'Save Milestone'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm"
                      onClick={() => setShowMilestoneForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {milestones.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 24 }}>
                No milestones created yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {milestones.map((ms) => (
                  <div key={ms.id} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ms.title}</div>
                        {ms.description && <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>{ms.description}</div>}
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Due: {formatDate(ms.due_date)}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <StatusBadge value={ms.status === 'SUBMITTED' ? 'SUBMITTED_MS' : ms.status} label={ms.status.replace('_', ' ')} />
                        {ms.status === 'PENDING' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSubmitMilestone(ms.id)}>
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                    {ms.review_note && (
                      <div className="alert alert-warning" style={{ marginTop: 8, marginBottom: 0 }}>
                        <strong>Review note:</strong> {ms.review_note}
                      </div>
                    )}
                    {ms.evidence?.length > 0 && (
                      <div className="media-grid" style={{ marginTop: 10 }}>
                        {ms.evidence.map((ev) => (
                          <img key={ev.id} src={ev.file_url} alt="Evidence" className="media-thumb" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
