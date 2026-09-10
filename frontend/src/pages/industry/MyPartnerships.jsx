import { useEffect, useState } from 'react'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getMyPartnerships } from '../../api/industry'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyPartnerships() {
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyPartnerships()
      .then(({ data }) => setPartnerships(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError('Unable to load partnerships.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div><TopHeader title="My Partnerships" /><div className="page-content"><LoadingPage /></div></div>
  )

  return (
    <div>
      <TopHeader title="My Partnerships" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">My Partnerships</h1>
          <p className="page-subtitle">Track your support commitments to active projects.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && partnerships.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No partnerships yet"
            subtitle="Browse projects and offer support to start a partnership."
          />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {partnerships.map((p) => (
              <div key={p.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.challenge_title}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                        {p.university_name}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag">{p.support_type?.replace('_', ' ')}</span>
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                    <StatusBadge value={p.status} />
                  </div>
                  <div style={{ marginTop: 14, padding: 12, background: 'var(--gray-50)', borderRadius: 6, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    {p.contribution_details}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => window.location.href = `/industry/partnerships/${p.id}`}>
                      View Detail
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
