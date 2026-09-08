import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import StatusBadge from '../../components/common/StatusBadge'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProblemTwinDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [twin, setTwin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTwin = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosClient.get(`/challenges/twins/${id}/`)
      setTwin(res.data)
    } catch {
      setError('Failed to load Problem Twin details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchTwin() }, [fetchTwin])

  const handleAction = async (reportId, action) => {
    try {
      await axiosClient.post(`/challenges/twins/${id}/${action}/`, { report_id: reportId })
      fetchTwin()
    } catch {
      alert('Action failed. Please try again.')
    }
  }

  return (
    <div>
      <TopHeader title={twin?.reference_id || 'Problem Twin'} />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/problem-twins')}>
            ← Back to Problem Twins
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingPage />
        ) : !twin ? (
          <div className="alert alert-error">Problem Twin not found.</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
              <code style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>{twin.reference_id}</code>
              <StatusBadge value={twin.status} />
              <span className={`badge ${
                twin.risk_level === 'ESCALATED' ? 'badge-high'
                : twin.risk_level === 'HIGH' ? 'badge-medium'
                : 'badge-low'
              }`}>
                {twin.risk_level} Risk
              </span>
            </div>

            <h1 className="page-title" style={{ marginBottom: 8, fontSize: 22 }}>{twin.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>
              {twin.district_name && <span>📍 {twin.district_name}</span>}
              {twin.category_name && <span>🏷️ {twin.category_name}</span>}
            </div>

            {/* AI Reasoning */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">AI Analysis &amp; Reasoning</span></div>
              <div className="card-body">
                {twin.ai_confidence != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(twin.ai_confidence * 100)}%`,
                        background: twin.ai_confidence > 0.8 ? '#10b981' : '#f59e0b',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {Math.round(twin.ai_confidence * 100)}% Confidence
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-600)', margin: 0 }}>
                  {twin.ai_reasoning || '—'}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">Key Dates</span></div>
                <div className="card-body">
                  {[
                    ['First Reported', twin.first_reported],
                    ['Latest Report', twin.last_reported],
                    ['Last Updated', twin.updated_at],
                  ].map(([label, val]) => (
                    <div key={label} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{formatDate(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked Reports */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Linked Citizen Reports ({twin.linked_challenges?.length || 0})</span>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Association</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {twin.linked_challenges?.length > 0 ? (
                      twin.linked_challenges.map(chl => (
                        <tr key={chl.id}>
                          <td>
                            <Link to={`/admin/challenges/${chl.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                              {chl.reference_id}
                            </Link>
                          </td>
                          <td className="table-cell-truncate">{chl.title}</td>
                          <td><StatusBadge value={chl.status} /></td>
                          <td>
                            <span className={`badge ${
                              chl.problem_twin_context?.association_status === 'PENDING' ? 'badge-pending' : 'badge-active'
                            }`}>
                              {chl.problem_twin_context?.association_status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td>
                            {chl.problem_twin_context?.association_status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleAction(chl.id, 'accept_report')}
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleAction(chl.id, 'reject_report')}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)' }}>
                          No citizen reports linked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
