import { useState, useEffect } from 'react'
import IndustryLayout from '../../components/industry/IndustryLayout'
import { getImpactSummary } from '../../api/industry'
import LoadingPage from '../../components/common/LoadingPage'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getImpactSummary()
      .then(({ data }) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <IndustryLayout>
        <LoadingPage />
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)', marginBottom: 8 }}>
          Industry Collaboration
        </h1>
        <p style={{ fontSize: 15, color: 'var(--gray-600)' }}>
          Discover projects, support innovation and create measurable impact.
        </p>
      </div>

      <div style={{ padding: '16px 20px', backgroundColor: 'var(--industry-primary-light)', borderRadius: 8, marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--industry-navy)' }}>
          Welcome back, {summary?.company_name || 'Industry Partner'}
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="label">Active Partnerships</div>
          <div className="value">{summary?.active_or_completed_partnerships || 0}</div>
        </div>
        <div className="metric-card">
          <div className="label">Projects Supported</div>
          <div className="value">{summary?.total_partnerships || 0}</div>
        </div>
        <div className="metric-card">
          <div className="label">Total Funding</div>
          <div className="value">₹{(summary?.total_funding_disbursed || 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="label">Impact Created</div>
          <div className="value">{summary?.projects_with_recorded_impact?.length || 0}</div>
        </div>
      </div>
    </IndustryLayout>
  )
}
