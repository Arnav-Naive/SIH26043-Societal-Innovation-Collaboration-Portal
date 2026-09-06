import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getMyChallenges } from '../../api/challenges'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function MyChallenges() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyChallenges()
      .then(({ data }) => setChallenges(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError('Unable to load your problems. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <TopHeader title="My Problems" />
      <div className="page-content"><LoadingPage /></div>
    </div>
  )

  return (
    <div>
      <TopHeader title="My Problems" />
      <div className="page-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">My Problems</h1>
            <p className="page-subtitle">Track the progress of problems you have submitted.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/citizen/submit-challenge')}
          >
            + Submit Problem
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && challenges.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No problems submitted yet"
            subtitle="Submit a local societal problem to begin your innovation journey."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/citizen/submit-challenge')}>
                Submit Problem
              </button>
            }
          />
        ) : (
          <div>
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className="challenge-card"
                onClick={() => navigate(`/citizen/challenges/${ch.id}`)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/citizen/challenges/${ch.id}`)}
                aria-label={`View details for ${ch.title}`}
              >
                <div className="challenge-card-title">{ch.title}</div>
                <div className="challenge-card-meta">
                  {ch.category && <span className="tag">{ch.category}</span>}
                  {ch.district && <span className="tag">📍 {ch.district}</span>}
                  <StatusBadge value={ch.priority} />
                </div>
                <div className="challenge-card-footer">
                  <StatusBadge value={ch.status} />
                  <span>{formatDate(ch.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
