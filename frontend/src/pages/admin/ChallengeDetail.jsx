import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import StatusTimeline from '../../components/common/StatusTimeline'
import LoadingPage from '../../components/common/LoadingPage'
import AIClassificationPanel from '../../components/admin/AIClassificationPanel'
import { getChallengeDetail, reviewChallenge, routeChallenge, updatePriority } from '../../api/challenges'
import { getRecommendedUniversities } from '../../api/universities'
import axiosClient from '../../api/axiosClient'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function RouteModal({ challenge, onClose, onSuccess }) {
  const [universities, setUniversities] = useState([])
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getRecommendedUniversities(challenge.id)
      .then(({ data }) => setUniversities(data))
      .catch(() => setError('Could not load university recommendations.'))
      .finally(() => setLoading(false))
  }, [challenge.id])

  const handleRoute = async () => {
    if (!selected) { setError('Please select a university.'); return }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await routeChallenge(challenge.id, selected, note)
      onSuccess(data)
    } catch {
      setError('Routing failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="route-modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" id="route-modal-title">Route to University</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 6, marginBottom: 20, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 6 }}>{challenge.title}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatusBadge value={challenge.priority} />
              {challenge.category && <span className="tag">{challenge.category}</span>}
              <span className="tag">📍 {challenge.district}</span>
            </div>
          </div>

          <div className="section-heading">Recommended Universities</div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <LoadingPage message="Loading recommendations..." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {universities.map((uni) => (
                <div
                  key={uni.id}
                  className={`uni-card${selected === uni.id ? ' selected' : ''}`}
                  onClick={() => setSelected(uni.id)}
                  tabIndex={0}
                  role="radio"
                  aria-checked={selected === uni.id}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(uni.id)}
                >
                  <div className="uni-card-name">{uni.name}</div>
                  <div className="uni-card-meta">📍 {uni.district}</div>
                  {uni.expertise_areas?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {uni.expertise_areas.map(a => <span key={a} className="tag">{a}</span>)}
                    </div>
                  )}
                  {uni.relevance_score >= 80 && (
                    <div className="uni-card-relevance">Strong Match — {uni.relevance_score}%</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="route-note">Routing Note (optional)</label>
            <textarea
              id="route-note"
              className="form-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any context for the university SPOC..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleRoute}
            disabled={!selected || submitting}
          >
            {submitting ? <><span className="spinner spinner-sm" /> Routing...</> : 'Route Challenge'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    Promise.all([
      getChallengeDetail(id),
      axiosClient.get('/master/categories/').catch(() => ({ data: [] }))
    ])
      .then(([{ data }, { data: cats }]) => {
        setChallenge(data)
        const catNames = Array.isArray(cats)
          ? cats.map(c => c.name)
          : (cats.results || []).map(c => c.name)
        setAvailableCategories(catNames)
      })
      .catch(() => setError('Unable to load challenge details.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleReview = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      const { data } = await reviewChallenge(id)
      setChallenge(data)
      setActionSuccess('Challenge marked as Under Review.')
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePriorityChange = async (priority) => {
    try {
      await updatePriority(id, priority)
      setChallenge(prev => ({ ...prev, priority }))
      setActionSuccess(`Priority updated to ${priority}.`)
    } catch {
      setActionError('Failed to update priority.')
    }
  }

  const handleRouteSuccess = (data) => {
    setChallenge(data)
    setShowRouteModal(false)
    setActionSuccess(`Challenge routed to ${data.assigned_university_name}.`)
  }

  if (loading) return (
    <div>
      <TopHeader title="Challenge Details" />
      <div className="page-content"><LoadingPage /></div>
    </div>
  )

  if (error || !challenge) return (
    <div>
      <TopHeader title="Challenge Details" />
      <div className="page-content">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )

  return (
    <div>
      <TopHeader title={challenge.reference_id} />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
        {actionError && <div className="alert alert-error">{actionError}</div>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <code style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>{challenge.reference_id}</code>
          <StatusBadge value={challenge.status} />
          <StatusBadge value={challenge.priority} />
        </div>

        <h1 className="page-title" style={{ marginBottom: 24, fontSize: 22 }}>{challenge.title}</h1>

        {/* Action Bar */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginRight: 4 }}>Actions:</span>
              {challenge.status === 'SUBMITTED' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleReview}
                  disabled={actionLoading}
                >
                  Mark Under Review
                </button>
              )}
              {['SUBMITTED', 'UNDER_REVIEW'].includes(challenge.status) && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowRouteModal(true)}
                >
                  Route to University
                </button>
              )}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Priority:</span>
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${challenge.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePriorityChange(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Classification & Priority Panel */}
        <AIClassificationPanel
          challenge={challenge}
          onUpdate={setChallenge}
          availableCategories={availableCategories}
        />

        {/* Status Timeline */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Status</span></div>
          <div className="card-body">
            <StatusTimeline status={challenge.status} />
          </div>
        </div>

        <div className="grid-2">
          {/* Problem Twin Context */}
          {challenge.problem_twin_context && (
            <div className="card" style={{ gridColumn: '1 / -1', background: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>
                    🧬 Part of Problem Twin: <strong>{challenge.problem_twin_context.title}</strong>
                  </h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: '#64748b' }}>
                    <span>Twin ID: {challenge.problem_twin_context.reference_id}</span>
                    <span>Status: {challenge.problem_twin_context.association_status}</span>
                    <span style={{ color: challenge.problem_twin_context.risk_level === 'ESCALATED' ? '#ef4444' : 'inherit' }}>
                      Risk: {challenge.problem_twin_context.risk_level}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate(`/admin/problem-twins/${challenge.problem_twin_context.id}`)}
                >
                  View Twin
                </button>
              </div>
            </div>
          )}

          {/* Problem Details */}
          <div className="card">
            <div className="card-header"><span className="card-title">Problem Details</span></div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">
                  Description
                  {challenge.original_language && challenge.original_language !== 'en' && (
                    <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>
                      (Original — {challenge.original_language})
                    </span>
                  )}
                </span>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</span>
              </div>
              {challenge.original_language && challenge.original_language !== 'en' && (
                <div className="detail-row">
                  <span className="detail-label">Normalized (English)</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                    {challenge.normalized_description}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">District</span>
                <span className="detail-value">{challenge.district}</span>
              </div>
              {challenge.location && (
                <div className="detail-row">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{challenge.location}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Category</span>
                <span className="detail-value">
                  {challenge.category}
                  {challenge.category_confidence > 0 && (
                    <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 6 }}>
                      ({challenge.category_confidence}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted By</span>
                <span className="detail-value">
                  {challenge.citizen?.first_name} {challenge.citizen?.last_name}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted On</span>
                <span className="detail-value">{formatDate(challenge.created_at)}</span>
              </div>
              {challenge.category_reason && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                  <strong>Classification reason:</strong> {challenge.category_reason}
                </div>
              )}
            </div>
          </div>

          {/* Routing Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Routing Information</span></div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">Assigned HEI</span>
                <span className="detail-value">
                  {challenge.assigned_university_name || (
                    <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not routed yet</span>
                  )}
                </span>
              </div>
              {challenge.routing_note && (
                <div className="detail-row">
                  <span className="detail-label">Routing Note</span>
                  <span className="detail-value">{challenge.routing_note}</span>
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                <div className="section-heading">Status History</div>
                {challenge.status_history?.map((h) => (
                  <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <StatusBadge value={h.status} />
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        {new Date(h.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {h.note && <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        {challenge.media?.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Evidence ({challenge.media.length})</span></div>
            <div className="card-body">
              <div className="media-grid">
                {challenge.media.map((m) => (
                  m.media_type === 'image' ? (
                    <img key={m.id} src={m.file_url} alt="Evidence" className="media-thumb" />
                  ) : (
                    <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
                      className="media-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', fontSize: 28 }}>
                      📄
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showRouteModal && (
        <RouteModal
          challenge={challenge}
          onClose={() => setShowRouteModal(false)}
          onSuccess={handleRouteSuccess}
        />
      )}
    </div>
  )
}
