import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getAssignedChallenges } from '../../api/universities'
import { getChallengeDetail, getChallengeDetail as getDetail } from '../../api/challenges'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AssignedChallenges() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAssignedChallenges()
      .then(({ data }) => setChallenges(Array.isArray(data) ? data : data.results || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('No university is linked to your account. Please contact the administrator.')
        } else {
          setError('Unable to load assigned challenges.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div><TopHeader title="Assigned Challenges" /><div className="page-content"><LoadingPage /></div></div>
  )

  return (
    <div>
      <TopHeader title="Assigned Challenges" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Assigned Challenges</h1>
          <p className="page-subtitle">
            Challenges routed to your university for research and innovation.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && challenges.length === 0 ? (
          <EmptyState
            icon="📥"
            title="No challenges assigned yet"
            subtitle="Challenges routed to your university will appear here."
          />
        ) : (
          <div>
            <div className="summary-grid" style={{ marginBottom: 24 }}>
              <div className="summary-card">
                <div className="summary-card-label">Total Assigned</div>
                <div className="summary-card-value">{challenges.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Routed (Pending Action)</div>
                <div className="summary-card-value">{challenges.filter(c => c.status === 'ROUTED').length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">In Progress</div>
                <div className="summary-card-value">{challenges.filter(c => c.status === 'IN_PROGRESS').length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Completed</div>
                <div className="summary-card-value">{challenges.filter(c => c.status === 'COMPLETED').length}</div>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Challenge</th>
                      <th>Category</th>
                      <th>District</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges.map((ch) => (
                      <tr key={ch.id}>
                        <td><code style={{ fontSize: 11, color: 'var(--color-primary)' }}>{ch.reference_id}</code></td>
                        <td className="table-cell-title">
                          <div className="table-cell-truncate" title={ch.title}>{ch.title}</div>
                        </td>
                        <td>{ch.category || '—'}</td>
                        <td>{ch.district}</td>
                        <td><StatusBadge value={ch.priority} /></td>
                        <td><StatusBadge value={ch.status} /></td>
                        <td style={{ fontSize: 12 }}>{formatDate(ch.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/hei/challenges/${ch.id}`)}
                            >
                              View
                            </button>
                            {ch.status === 'ROUTED' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/hei/challenges/${ch.id}/form-team`)}
                              >
                                Form Team
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
