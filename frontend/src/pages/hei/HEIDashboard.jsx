import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import TopHeader from '../../components/common/TopHeader'

export default function HEIDashboard() {
  const [stats, setStats] = useState({
    assigned_challenges: 0,
    accepted_challenges: 0,
    active_projects: 0,
    completed_projects: 0,
    total_challenges: 0,
    total_projects: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get('/universities/dashboard/stats/')
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching HEI stats:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <TopHeader title="HEI Dashboard" />
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)' }}>University Dashboard</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: 4 }}>Overview of your institution's innovation activities.</p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>Loading stats...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Challenges</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gray-900)', marginTop: 8 }}>{stats.assigned_challenges}</div>
            </div>
            <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--color-warning)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Accepted Challenges</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gray-900)', marginTop: 8 }}>{stats.accepted_challenges}</div>
            </div>
            <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--color-success)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Active Projects</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gray-900)', marginTop: 8 }}>{stats.active_projects}</div>
            </div>
            <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--gray-400)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Completed Projects</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gray-900)', marginTop: 8 }}>{stats.completed_projects}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Quick Actions</h2>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/hei/assigned-challenges" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--gray-100)' }}>
                  📋 View Assigned Challenges
                </Link>
                <Link to="/hei/my-teams" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--gray-100)' }}>
                  🚀 Manage Active Projects
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
