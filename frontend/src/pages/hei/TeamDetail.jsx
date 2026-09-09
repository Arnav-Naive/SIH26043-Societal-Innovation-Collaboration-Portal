import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import { getTeamDetail, getFaculties, updateTeam } from '../../api/universities'
import { getTeamMilestones, createMilestone, submitMilestone, getProjectImpact, submitProjectImpact } from '../../api/projects'
import { getTeamPartnerships } from '../../api/industry'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TAB_STYLE = (active) => ({
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  color: active ? 'var(--color-primary)' : 'var(--gray-600)',
  borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
  whiteSpace: 'nowrap',
  fontSize: 14,
})

export default function TeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Milestone state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '' })
  const [milestoneError, setMilestoneError] = useState('')
  const [milestoneLoading, setMilestoneLoading] = useState(false)
  const [milestoneEvidenceFile, setMilestoneEvidenceFile] = useState(null)

  // Team edit state
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ faculty_mentor_id: '', students: [] })
  const [faculties, setFaculties] = useState([])
  const [savingTeam, setSavingTeam] = useState(false)

  // Industry state
  const [partnerships, setPartnerships] = useState([])

  // Impact state
  const [impact, setImpact] = useState(null)
  const [impactForm, setImpactForm] = useState({
    beneficiaries_count: 0,
    cost_incurred: 0,
    adoption_rate: '',
    before_metrics: '',
    after_metrics: ''
  })
  const [impactFile, setImpactFile] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)

  const loadData = async () => {
    try {
      const [teamRes, msRes, facRes, partnerRes, impactRes] = await Promise.all([
        getTeamDetail(id),
        getTeamMilestones(id),
        getFaculties(),
        getTeamPartnerships(id),
        getProjectImpact(id).catch(() => ({ data: null })),
      ])
      const t = teamRes.data
      setTeam(t)
      setTeamForm({
        faculty_mentor_id: t.faculty_mentor?.id || '',
        students: t.students || []
      })
      setMilestones(Array.isArray(msRes.data) ? msRes.data : msRes.data.results || [])
      setFaculties(Array.isArray(facRes.data) ? facRes.data : facRes.data.results || [])
      setPartnerships(Array.isArray(partnerRes.data) ? partnerRes.data : partnerRes.data.results || [])
      if (impactRes.data) {
        setImpact(impactRes.data)
        setImpactForm({
          beneficiaries_count: impactRes.data.beneficiaries_count || 0,
          cost_incurred: impactRes.data.cost_incurred || 0,
          adoption_rate: impactRes.data.adoption_rate || '',
          before_metrics: impactRes.data.before_metrics || '',
          after_metrics: impactRes.data.after_metrics || ''
        })
      }
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
      const formData = new FormData()
      if (milestoneEvidenceFile) {
        formData.append('evidence', milestoneEvidenceFile)
      }
      await submitMilestone(msId, formData)
      setMilestoneEvidenceFile(null)
      loadData()
    } catch {
      alert('Failed to submit milestone.')
    }
  }

  const handleSaveTeam = async () => {
    setSavingTeam(true)
    try {
      await updateTeam(id, {
        faculty_mentor_id: teamForm.faculty_mentor_id || null,
        students: teamForm.students.filter(s => s.trim())
      })
      setIsEditingTeam(false)
      loadData()
    } catch {
      alert('Failed to save team updates.')
    } finally {
      setSavingTeam(false)
    }
  }

  const handleSaveImpact = async (e) => {
    e.preventDefault()
    setImpactLoading(true)
    const formData = new FormData()
    formData.append('beneficiaries_count', impactForm.beneficiaries_count)
    formData.append('cost_incurred', impactForm.cost_incurred)
    formData.append('adoption_rate', impactForm.adoption_rate)
    formData.append('before_metrics', impactForm.before_metrics)
    formData.append('after_metrics', impactForm.after_metrics)
    if (impactFile) formData.append('outcome_evidence', impactFile)
    try {
      await submitProjectImpact(id, formData)
      alert('Impact metrics submitted! Project is marked completed.')
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit impact.')
    } finally {
      setImpactLoading(false)
    }
  }

  if (loading) return (
    <div><TopHeader title="Project Workspace" /><div className="page-content"><LoadingPage /></div></div>
  )

  if (error || !team) return (
    <div><TopHeader title="Project Workspace" />
      <div className="page-content">
        <div className="alert alert-error">{error || 'Team not found.'}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )

  return (
    <div>
      <TopHeader title="Project Workspace" />
      <div className="page-content">

        {/* Back */}
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title" style={{ fontSize: 20 }}>
            {team.project_title || team.challenge?.title}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>
            Challenge: {team.challenge?.reference_id} — {team.challenge?.title}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge value={team.challenge?.priority} />
            <StatusBadge value={team.challenge?.status} />
            <span className="tag">Stage: {team.stage}</span>
            <span className="tag">🏛 {team.university?.name}</span>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 24, overflowX: 'auto' }}>
          {['overview', 'team', 'milestones', 'industry', 'impact'].map(tab => (
            <button
              key={tab}
              style={TAB_STYLE(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📋 Overview'}
              {tab === 'team' && '👥 Team'}
              {tab === 'milestones' && `🎯 Milestones (${milestones.length})`}
              {tab === 'industry' && '🏭 Industry'}
              {tab === 'impact' && '📊 Impact'}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="grid-2" style={{ gap: 20 }}>
            {/* Project Info */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Project Details</span>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">Project Title</span>
                  <span className="detail-value">{team.project_title || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Domain</span>
                  <span className="detail-value">{team.domain || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Objective</span>
                  <span className="detail-value">{team.objective || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">University</span>
                  <span className="detail-value">{team.university?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Faculty Mentor</span>
                  <span className="detail-value">
                    {team.faculty_mentor
                      ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                      : <em style={{ color: 'var(--gray-400)' }}>Not assigned</em>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Stage</span>
                  <span className="detail-value">{team.stage}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Formed On</span>
                  <span className="detail-value">{formatDate(team.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Solution Proposal */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Solution Proposal</span>
              </div>
              <div className="card-body">
                {team.project_description ? (
                  <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {team.project_description}
                  </p>
                ) : (
                  <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 13 }}>No solution description provided.</p>
                )}
              </div>
            </div>

            {/* Progress Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Progress Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{milestones.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Total Milestones</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>
                      {milestones.filter(m => m.status === 'APPROVED').length}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Approved</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-warning)' }}>
                      {milestones.filter(m => m.status === 'PENDING').length}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Pending</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-600)' }}>{partnerships.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Industry Partners</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Team Tab ── */}
        {activeTab === 'team' && (
          <div className="card" style={{ maxWidth: 640 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Team Composition</span>
              {!isEditingTeam ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingTeam(true)}>Edit Team</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveTeam} disabled={savingTeam}>
                    {savingTeam ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    setIsEditingTeam(false)
                    setTeamForm({ faculty_mentor_id: team.faculty_mentor?.id || '', students: team.students || [] })
                  }}>Cancel</button>
                </div>
              )}
            </div>
            <div className="card-body">
              {!isEditingTeam ? (
                <>
                  <div className="detail-row" style={{ marginBottom: 16 }}>
                    <span className="detail-label">Faculty Mentor</span>
                    <span className="detail-value">
                      {team.faculty_mentor
                        ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                        : <em style={{ color: 'var(--gray-400)' }}>Not assigned</em>}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase' }}>Students</div>
                  {team.students?.length > 0 ? (
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {team.students.map((s, i) => (
                        <li key={i} style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 6 }}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>No students added.</p>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Faculty Mentor</label>
                    <select
                      className="form-control"
                      value={teamForm.faculty_mentor_id}
                      onChange={e => setTeamForm(f => ({ ...f, faculty_mentor_id: e.target.value }))}
                    >
                      <option value="">Select faculty mentor (optional)</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.first_name} {f.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Students</label>
                    {teamForm.students.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          type="text"
                          className="form-control"
                          value={s}
                          onChange={e => setTeamForm(f => ({
                            ...f,
                            students: f.students.map((st, idx) => idx === i ? e.target.value : st)
                          }))}
                          placeholder="Student name"
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setTeamForm(f => ({ ...f, students: f.students.filter((_, idx) => idx !== i) }))}
                        >×</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTeamForm(f => ({ ...f, students: [...f.students, ''] }))}
                    >+ Add Student</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Milestones Tab ── */}
        {activeTab === 'milestones' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Milestones ({milestones.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
                {showMilestoneForm ? 'Cancel' : '+ Add Milestone'}
              </button>
            </div>
            <div className="card-body">

              {/* Add Milestone Form */}
              {showMilestoneForm && (
                <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>New Milestone</div>
                  {milestoneError && <div className="alert alert-error">{milestoneError}</div>}
                  <form onSubmit={handleCreateMilestone}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ms-title">Title <span className="required">*</span></label>
                      <input
                        id="ms-title"
                        className="form-control"
                        value={milestoneForm.title}
                        onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g., Prototype Demo"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ms-desc">Description</label>
                      <textarea
                        id="ms-desc"
                        className="form-control"
                        rows={2}
                        value={milestoneForm.description}
                        onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="ms-date">Due Date <span className="required">*</span></label>
                      <input
                        id="ms-date"
                        type="date"
                        className="form-control"
                        value={milestoneForm.due_date}
                        onChange={e => setMilestoneForm(f => ({ ...f, due_date: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={milestoneLoading}>
                        {milestoneLoading ? 'Saving...' : 'Save Milestone'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMilestoneForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Milestone List */}
              {milestones.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 32, fontStyle: 'italic' }}>
                  No milestones yet. Add your first milestone above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {milestones.map(ms => (
                    <div key={ms.id} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ms.title}</div>
                          {ms.description && (
                            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>{ms.description}</div>
                          )}
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Due: {formatDate(ms.due_date)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <StatusBadge value={ms.status} />
                          {ms.status === 'PENDING' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                              <input
                                type="file"
                                style={{ fontSize: 11, maxWidth: 180 }}
                                onChange={e => setMilestoneEvidenceFile(e.target.files[0])}
                              />
                              <button className="btn btn-secondary btn-sm" onClick={() => handleSubmitMilestone(ms.id)}>
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {ms.review_note && (
                        <div className="alert alert-warning" style={{ marginTop: 8, marginBottom: 0 }}>
                          <strong>Review note:</strong> {ms.review_note}
                        </div>
                      )}
                      {ms.evidence?.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {ms.evidence.map(ev => (
                            <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer">
                              <img src={ev.file_url} alt="Evidence" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Industry Tab ── */}
        {activeTab === 'industry' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Industry Collaboration</span>
            </div>
            <div className="card-body">
              {partnerships.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
                  <p style={{ color: 'var(--gray-500)', marginBottom: 4 }}>No industry partnerships yet.</p>
                  <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                    Industry partners can discover your project on the Industry Portal and offer support, funding, or mentorship.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {partnerships.map(p => (
                    <div key={p.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.industry_partner?.company_name || 'Industry Partner'}</div>
                        <StatusBadge value={p.status} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                        Support Type: <strong style={{ color: 'var(--gray-700)' }}>{p.support_type?.replace(/_/g, ' ')}</strong>
                      </div>
                      {p.contribution_details && (
                        <p style={{ fontSize: 14, color: 'var(--gray-700)', margin: 0 }}>{p.contribution_details}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Impact Tab ── */}
        {activeTab === 'impact' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Outcome &amp; Impact Submission</span>
            </div>
            <div className="card-body">
              {team.stage !== 'IMPACT' && !impact ? (
                <div>
                  <div className="alert alert-warning">
                    Impact submission is available when the project reaches the <strong>IMPACT</strong> stage.
                    Current stage: <strong>{team.stage}</strong>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 12 }}>
                    Complete all milestones and request a stage advancement from your administrator to unlock this section.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveImpact}>
                  {impact?.verified_by_admin && (
                    <div className="alert alert-success" style={{ marginBottom: 20 }}>
                      ✓ This impact report has been <strong>verified</strong> by the government administrator.
                    </div>
                  )}
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Beneficiaries Count <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={impactForm.beneficiaries_count}
                        onChange={e => setImpactForm(f => ({ ...f, beneficiaries_count: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cost Saved / Incurred (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={impactForm.cost_incurred}
                        onChange={e => setImpactForm(f => ({ ...f, cost_incurred: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adoption Rate / Area Covered <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={impactForm.adoption_rate}
                      onChange={e => setImpactForm(f => ({ ...f, adoption_rate: e.target.value }))}
                      placeholder="e.g., Deployed across 5 panchayats, 2000 households"
                      required
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Before Pilot Metrics</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={impactForm.before_metrics}
                        onChange={e => setImpactForm(f => ({ ...f, before_metrics: e.target.value }))}
                        placeholder="Baseline situation before the solution..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">After Pilot Metrics</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={impactForm.after_metrics}
                        onChange={e => setImpactForm(f => ({ ...f, after_metrics: e.target.value }))}
                        placeholder="Measurable improvements after deployment..."
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Validation Document / Evidence</label>
                    {impact?.outcome_evidence && (
                      <div style={{ marginBottom: 8 }}>
                        <a href={impact.outcome_evidence} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: 13 }}>
                          View Existing Evidence ↗
                        </a>
                      </div>
                    )}
                    <input type="file" className="form-control" onChange={e => setImpactFile(e.target.files[0])} />
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary" disabled={impactLoading}>
                      {impactLoading ? 'Submitting...' : impact ? 'Update Impact Report' : 'Submit Final Impact'}
                    </button>
                    {impact?.verified_by_admin && (
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Verified by Admin</span>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
