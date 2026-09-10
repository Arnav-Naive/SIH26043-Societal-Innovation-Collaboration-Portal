import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import { getCitizenSummary } from '../../api/analytics'
import { getMyChallenges } from '../../api/challenges'
import { getNotifications } from '../../api/auth'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function StatCard({ title, value, icon, colorClass }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div className={colorClass} style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          {title}
        </div>
      </div>
    </div>
  )
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCitizenSummary(),
      getMyChallenges(),
      getNotifications()
    ])
      .then(([statsRes, challengesRes, notifsRes]) => {
        setStats(statsRes.data)
        const allChallenges = Array.isArray(challengesRes.data) ? challengesRes.data : (challengesRes.data.results || [])
        setRecent(allChallenges.slice(0, 4))
        setNotifs(Array.isArray(notifsRes.data) ? notifsRes.data.slice(0, 3) : (notifsRes.data.results || []).slice(0, 3))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <TopHeader title="Citizen Portal" />
      <div className="page-content"><LoadingPage /></div>
    </div>
  )

  return (
    <div>
      <TopHeader title="Citizen Portal" />
      <div className="page-content citizen-dashboard-grid" style={{ maxWidth: 1200, margin: '0 auto', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column - Main Content */}
        <div className="dashboard-col-left">
          {/* Welcome & Primary CTA */}
          <div className="dash-hero" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', borderRadius: 16, padding: '40px 30px', color: '#fff', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '0 0 12px' }}>
                Namaste, {user?.first_name || 'Citizen'} 👋
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5, maxWidth: 500 }}>
                Track your reported problems and help build a cleaner, smarter, stronger Jharkhand.
              </p>
            </div>
            <div>
              <button 
                className="btn" 
                onClick={() => navigate('/citizen/submit-challenge')}
                style={{ background: '#fff', color: 'var(--color-primary-dark)', padding: '14px 28px', fontSize: 16, borderRadius: 8, fontWeight: 700, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                🚀 Report a Problem
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="citizen-stat-grid dash-stats" style={{ gap: 16, marginBottom: 24 }}>
            <StatCard title="Reported" value={stats?.total_challenges || 0} icon="📝" colorClass="bg-gray-100 text-gray-600" />
            <StatCard title="Under Review" value={stats?.under_review || 0} icon="🔍" colorClass="bg-warning-light text-warning" />
            <StatCard title="In Progress" value={stats?.in_progress || 0} icon="⚙️" colorClass="bg-primary-light text-primary" />
            <StatCard title="Resolved" value={stats?.completed || 0} icon="✅" colorClass="bg-success-light text-success" />
          </div>

          {/* Recent Problems Detailed List */}
          <div className="card dash-recent-problems">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📄</span> Recent Problems
              </span>
              <Link to="/citizen/my-challenges" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>View All →</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recent.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🌱</div>
                  <h3 style={{ margin: '0 0 8px', color: 'var(--gray-900)' }}>No problems reported yet</h3>
                  <p style={{ margin: 0 }}>Submit your first problem to start making an impact.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recent.map((ch, idx) => (
                    <div
                      key={ch.id}
                      onClick={() => navigate(`/citizen/challenges/${ch.id}`)}
                      className="recent-problem-row hover-bg-gray-50"
                      style={{ 
                        padding: '16px 20px', 
                        borderBottom: idx === recent.length - 1 ? 'none' : '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="recent-problem-img" style={{ borderRadius: 8, background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {ch.media && ch.media.length > 0 && ch.media[0].media_type === 'image' ? (
                          <img src={ch.media[0].file_url || ch.media[0].file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 24, color: 'var(--gray-400)' }}>📷</span>
                        )}
                      </div>
                      <div className="recent-problem-info">
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 15, marginBottom: 4 }}>{ch.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace' }}>{ch.reference_id}</span>
                          {ch.category && <span>• {ch.category}</span>}
                          {ch.district && <span>• 📍 {ch.district}</span>}
                        </div>
                      </div>
                      <div className="recent-problem-meta" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <StatusBadge value={ch.priority} />
                        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>📅 {formatDate(ch.created_at)}</span>
                      </div>
                      <div className="recent-problem-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <StatusBadge value={ch.status} />
                        <span style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}>View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card dash-quote" style={{ padding: 24, background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--gray-600)', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.5 }}>
              "Your voice can create real change."
            </h3>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>— Government of Jharkhand</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <div style={{ fontSize: 32 }}>🌱</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                Cleaner Communities<br/>
                Stronger Jharkhand<br/>
                Brighter Tomorrow
              </div>
            </div>
          </div>

          <div className="card dash-quick-actions">
            <div className="card-header"><span className="card-title" style={{ fontSize: 16 }}>🧭 Quick Actions</span></div>
            <div className="card-body" style={{ padding: '8px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/citizen/submit-challenge" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', color: 'var(--color-primary-dark)' }}>
                  <span style={{ width: 24, display: 'inline-block' }}>➕</span> Report a Problem
                </Link>
                <Link to="/citizen/my-challenges" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--success-light)', color: 'var(--color-success-dark)' }}>
                  <span style={{ width: 24, display: 'inline-block' }}>📋</span> View My Problems
                </Link>
                <Link to="/citizen/profile" className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--warning-light)', color: 'var(--color-warning-dark)' }}>
                  <span style={{ width: 24, display: 'inline-block' }}>👤</span> Update Profile
                </Link>
              </div>
            </div>
          </div>

          <div className="card dash-latest-updates">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ fontSize: 16 }}>🔔 Latest Updates</span>
            </div>
            <div className="card-body" style={{ padding: 16 }}>
              {notifs.length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: 13, textAlign: 'center' }}>No new updates.</div>
              ) : (
                <div className="timeline-vertical" style={{ margin: 0, gap: 16 }}>
                  {notifs.map(n => (
                    <div key={n.id} className="timeline-vertical-step" style={{ gap: 12 }}>
                      <div className="timeline-vertical-dot" style={{ width: 12, height: 12, minWidth: 12, background: n.is_read ? 'var(--gray-300)' : 'var(--color-primary)', border: 'none' }} />
                      <div className="timeline-vertical-content" style={{ paddingTop: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--gray-900)', fontWeight: n.is_read ? 400 : 600, lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>{formatDate(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
