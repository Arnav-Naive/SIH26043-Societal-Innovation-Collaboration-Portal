import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSummary } from '../../api/analytics'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getSummary()
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="landing-page" style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 5%', background: '#fff', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>SX</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary-dark)' }}>SamadhanX</span>
        </div>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#how-it-works" className="desktop-only" style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: 14 }}>How It Works</a>
          <a href="#impact" className="desktop-only" style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: 14 }}>Impact</a>
          {user ? (
            <Link to={user.role === 'citizen' ? '/citizen/dashboard' : (user.role === 'gov_admin' ? '/admin/dashboard' : user.role === 'industry_partner' ? '/industry/dashboard' : user.role === 'faculty_mentor' ? '/faculty/my-teams' : '/hei/dashboard')} className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm desktop-only">Register</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 20px', textAlign: 'center', background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', color: '#fff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', maxWidth: 800, margin: '0 auto 24px', lineHeight: 1.1 }}>
          Your Problem Can Become a Solution
        </h1>
        <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', maxWidth: 650, margin: '0 auto 40px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
          Report issues in your community and let our multidisciplinary university teams work on innovative, real-world solutions.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/citizen/submit-challenge" className="btn" style={{ background: '#fff', color: 'var(--color-primary-dark)', padding: '14px 28px', fontSize: 16, borderRadius: 8, fontWeight: 600 }}>Report a Problem</Link>
          <Link to="/citizen/my-challenges" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px', fontSize: 16, borderRadius: 8, fontWeight: 600 }}>Track Your Issue</Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 48 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {[
            { step: '1', title: 'Report', desc: 'Share your problem in simple steps' },
            { step: '2', title: 'Verify', desc: 'Reviewed by Government' },
            { step: '3', title: 'Match', desc: 'Assigned to the best University' },
            { step: '4', title: 'Solve', desc: 'Students & faculty work on solutions' },
            { step: '5', title: 'Track', desc: 'See real-time progress' }
          ].map(s => (
            <div key={s.step} className="card" style={{ padding: '32px 24px', textAlign: 'center', height: '100%' }}>
              <div style={{ width: 56, height: 56, background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, margin: '0 auto 20px' }}>{s.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section id="impact" style={{ padding: '80px 20px', background: '#fff', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 48 }}>Platform Impact</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--gray-50)', border: 'none' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>{stats?.total_challenges || '...'}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Problems Reported</div>
            </div>
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--gray-50)', border: 'none' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>{stats?.in_progress || '...'}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Solutions in Progress</div>
            </div>
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--gray-50)', border: 'none' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>{stats?.completed || '...'}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Problems Resolved</div>
            </div>
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--gray-50)', border: 'none' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 8 }}>{stats?.teams_formed || '...'}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Student Teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--gray-900)', color: 'var(--gray-400)', padding: '60px 20px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 20 }}>SamadhanX Public Portal</div>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>Empowering citizens and academic institutions to collaborate on societal challenges.</div>
          <div style={{ marginTop: 32, fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
            © {new Date().getFullYear()} Government of India. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
