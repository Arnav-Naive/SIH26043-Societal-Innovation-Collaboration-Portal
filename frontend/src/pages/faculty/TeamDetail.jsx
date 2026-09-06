import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import { getTeamDetail } from '../../api/universities'
import { getTeamMilestones, reviewMilestone, createMilestone, submitMilestone } from '../../api/projects'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function FacultyTeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewLoading, setReviewLoading] = useState(null)
  const [reviewNote, setReviewNote] = useState({})
  const [actionMsg, setActionMsg] = useState('')

  // New states for milestone creation
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
      setActionMsg('Milestone created successfully.')
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
      setActionMsg('Milestone submitted successfully.')
    } catch {
      alert('Failed to submit milestone.')
    }
  }

  const handleReview = async (msId, action) => {
    setReviewLoading(msId)
    setActionMsg('')
    try {
      await reviewMilestone(msId, action, reviewNote[msId] || '')
      setActionMsg(`Milestone ${action === 'approve' ? 'approved' : 'returned for changes'}.`)
      loadData()
    } catch (err) {
      setActionMsg(err.response?.data?.detail || 'Review failed.')
    } finally {
      setReviewLoading(null)
    }
  }

  if (loading) return (
    <div><TopHeader title="Team Review" /><div className="page-content"><LoadingPage /></div></div>
  )

  if (error || !team) return (
    <div><TopHeader title="Team Review" />
      <div className="page-content">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )

  const submittedMilestones = milestones.filter(m => m.status === 'SUBMITTED')
  const approvedMilestones = milestones.filter(m => m.status === 'APPROVED')

  return (
    <div>
      <TopHeader title="Team Review" />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>

        {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

        <div className="page-header">
          <h1 className="page-title">{team.challenge?.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <StatusBadge value={team.challenge?.priority} />
            <StatusBadge value={team.challenge?.status} />
          </div>
        </div>

        {/* Summary */}
        <div className="summary-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="summary-card">
            <div className="summary-card-label">Pending Review</div>
            <div className="summary-card-value">{submittedMilestones.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Approved</div>
            <div className="summary-card-value">{approvedMilestones.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Total</div>
            <div className="summary-card-value">{milestones.length}</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Team Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Team</span></div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">University</span>
                <span className="detail-value">{team.university?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stage</span>
                <span className="detail-value">{team.stage}</span>
              </div>
              <div className="detail-section-title" style={{ marginTop: 16 }}>Students</div>
              {team.students?.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 4 }}>• {s}</div>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="card">
            <div className="card-header"><span className="card-title">Project</span></div>
            <div className="card-body">
              <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>
                {team.project_description || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No description</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Milestones for Review/Creation */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Milestones</span>
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
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 24 }}>No milestones created.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {milestones.map((ms) => (
                  <div key={ms.id} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
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

                    {ms.evidence?.length > 0 && (
                      <div className="media-grid" style={{ marginTop: 10 }}>
                        {ms.evidence.map((ev) => (
                          <img key={ev.id} src={ev.file_url} alt="Evidence" className="media-thumb" />
                        ))}
                      </div>
                    )}

                    {ms.status === 'SUBMITTED' && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Review Note (optional)</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            style={{ fontSize: 13 }}
                            value={reviewNote[ms.id] || ''}
                            onChange={e => setReviewNote(n => ({ ...n, [ms.id]: e.target.value }))}
                            placeholder="Add feedback or comments..."
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReview(ms.id, 'approve')}
                            disabled={reviewLoading === ms.id}
                          >
                            {reviewLoading === ms.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReview(ms.id, 'request_changes')}
                            disabled={reviewLoading === ms.id}
                          >
                            Request Changes
                          </button>
                        </div>
                      </div>
                    )}

                    {ms.review_note && ms.status !== 'SUBMITTED' && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-50)', padding: 10, borderRadius: 6 }}>
                        <strong>Review note:</strong> {ms.review_note}
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
