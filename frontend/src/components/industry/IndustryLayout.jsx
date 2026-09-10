import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function IndustryLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  const navItems = [
    { label: 'Dashboard', path: '/industry/dashboard' },
    { label: 'Browse Projects', path: '/industry/browse-projects' },
    { label: 'My Partnerships', path: '/industry/partnerships' },
    { label: 'My Contributions', path: '/industry/contributions' },
    { label: 'Contribution History', path: '/industry/contribution-history' },
    { label: 'Notifications', path: '/industry/notifications' },
    { label: 'Profile & Settings', path: '/profile' },
  ]

  return (
    <div className="industry-layout">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`industry-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="industry-sidebar-header">
          <div>
            <h2>SamadhanX</h2>
            <div className="subtitle">Industry Portal</div>
          </div>
        </div>

        <nav className="industry-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`industry-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="industry-sidebar-footer">
          <Link to="/help" className="industry-nav-item" style={{ padding: '8px 12px' }}>Help & Support</Link>
          <button 
            onClick={logout} 
            className="industry-nav-item" 
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: '8px 12px', textAlign: 'left' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="industry-main">
        {/* Top Header */}
        <header className="industry-topbar">
          <div className="industry-topbar-left">
            <button className="menu-toggle-btn" onClick={toggleMobileMenu}>
              ☰
            </button>
            <div style={{ fontWeight: 600, color: 'var(--industry-navy)' }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.first_name?.[0] || 'I'}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="industry-content">
          {children}
        </div>
      </main>
    </div>
  )
}
