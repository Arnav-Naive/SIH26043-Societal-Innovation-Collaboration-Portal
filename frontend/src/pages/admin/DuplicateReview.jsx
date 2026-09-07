import { useEffect, useState, useCallback } from 'react'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import { getDuplicateFlags, reviewDuplicateFlag } from '../../api/challenges'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SimilarityBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 90 ? 'var(--color-error, #dc2626)' : pct >= 85 ? 'var(--color-warning, #f59e0b)' : 'var(--color-primary, #2563eb)'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontWeight: 700,
      fontSize: 13,
      background: color,
      color: '#fff',
    }}>
      {pct}% match
    </span>
  )
}

function ChallengeCard({ challenge, label }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400, #888)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ marginBottom: 8 }}>
        <code style={{ fontSize: 11, color: 'var(--color-primary, #2563eb)' }}>
          {challenge.reference_id}
        </code>
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px 0', lineHeight: 1.4 }}>
        {challenge.title}
      </h4>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {challenge.category && (
          <span className="badge" style={{ fontSize: 11 }}>{challenge.category}</span>
        )}
        {challenge.district && (
          <span className="badge" style={{ fontSize: 11 }}>{challenge.district}</span>
        )}
        <StatusBadge value={challenge.priority} />
        <StatusBadge value={challenge.status} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-500, #6b7280)', marginBottom: 4 }}>
        Submitted by: <strong>{challenge.citizen_name}</strong>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-400, #9ca3af)' }}>
        {formatDate(challenge.created_at)}
      </div>
    </div>
  )
}

export default function DuplicateReview() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // flag id being acted on

  const loadFlags = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDuplicateFlags({ status: 'pending_review' })
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setFlags(data)
    } catch {
      setError('Unable to load duplicate flags. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFlags() }, [loadFlags])

  const handleReview = async (flagId, decision) => {
    // Optimistic update: remove card immediately
    const prevFlags = flags
    setFlags(prev => prev.filter(f => f.id !== flagId))
    setActionLoading(flagId)

    try {
      await reviewDuplicateFlag(flagId, decision)
    } catch {
      // Revert on failure
      setFlags(prevFlags)
      setError('Failed to submit review. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <TopHeader title="Duplicate Review" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Duplicate Challenge Review</h1>
          <p className="page-subtitle">
            AI-detected potential duplicate challenges. Compare side-by-side and decide.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingPage />
        ) : flags.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No pending duplicates"
            subtitle="All duplicate flags have been reviewed. Check back later."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {flags.map(flag => (
              <div key={flag.id} className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title" style={{ fontSize: 14 }}>
                    Potential Duplicate
                  </span>
                  <SimilarityBadge score={flag.similarity_score} />
                </div>
                <div className="card-body">
                  {/* Side-by-side comparison */}
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <ChallengeCard challenge={flag.challenge_a} label="Challenge A" />
                    <div style={{
                      width: 1,
                      background: 'var(--gray-200, #e5e7eb)',
                      alignSelf: 'stretch',
                      flexShrink: 0,
                    }} />
                    <ChallengeCard challenge={flag.challenge_b} label="Challenge B" />
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--gray-200, #e5e7eb)',
                  }}>
                    <button
                      className="btn btn-secondary"
                      disabled={actionLoading === flag.id}
                      onClick={() => handleReview(flag.id, 'not_duplicate')}
                    >
                      ✗ Not a Duplicate
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={actionLoading === flag.id}
                      onClick={() => handleReview(flag.id, 'confirmed_duplicate')}
                      style={{ background: 'var(--color-error, #dc2626)', borderColor: 'var(--color-error, #dc2626)' }}
                    >
                      ✓ Confirm Duplicate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
