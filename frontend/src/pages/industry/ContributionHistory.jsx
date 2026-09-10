import { useEffect, useState } from 'react'
import IndustryLayout from '../../components/industry/IndustryLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getMyPartnerships } from '../../api/industry'

export default function ContributionHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now, we are deriving "Contribution History" from Partnerships
    // since every partnership can be seen as a set of contributions.
    getMyPartnerships()
      .then(({ data }) => {
        const pList = Array.isArray(data) ? data : data.results || []
        // Mock impact connection by reading the team stage
        const mapped = pList.map(p => ({
          ...p,
          impact_connection: p.project_team?.stage || 'Development'
        }))
        setHistory(mapped)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getIconForType = (type) => {
    if (type === 'FUNDING') return '💰'
    if (type === 'MENTORSHIP') return '🧠'
    if (type === 'INFRASTRUCTURE') return '⚙️'
    if (type === 'PILOT') return '🚀'
    return '📦'
  }

  const formatValue = (p) => {
    if (p.support_type === 'FUNDING' && p.amount) return `₹${p.amount.toLocaleString()}`
    // Extract quantity from details if it was formatted that way
    const match = p.contribution_details?.match(/Quantity\/Amount: (.*?). Date:/)
    if (match) return match[1]
    return 'N/A'
  }

  return (
    <IndustryLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0' }}>CONTRIBUTION HISTORY</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0 }}>Review all your past and ongoing support across projects.</p>
      </div>

      {loading ? (
        <LoadingPage />
      ) : history.length === 0 ? (
        <EmptyState icon="📜" title="No Contributions Yet" subtitle="When you offer support to a project, it will appear here." />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {history.map(item => (
            <div key={item.id} className="contribution-card">
              <div className="contribution-icon">
                {getIconForType(item.support_type)}
              </div>
              
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--industry-navy)' }}>
                    {item.project_team?.challenge?.title || 'Project'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, textTransform: 'uppercase' }}>Type & Value</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--industry-primary)' }}>
                    {item.support_type} • {formatValue(item)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, textTransform: 'uppercase' }}>Impact Connection</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--industry-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🔗</span> Drives {item.impact_connection}
                  </div>
                </div>

                <div style={{ justifySelf: 'flex-end' }}>
                  <StatusBadge value={item.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </IndustryLayout>
  )
}
