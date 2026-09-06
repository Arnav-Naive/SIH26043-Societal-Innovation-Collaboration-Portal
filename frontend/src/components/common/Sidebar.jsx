// Sidebar component — role-based navigation
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = {
  citizen: 'Citizen',
  hei_spoc: 'HEI SPOC',
  faculty_mentor: 'Faculty Mentor',
  industry_partner: 'Industry Partner',
  gov_admin: 'Government Admin',
}

const NAV_ITEMS = {
  citizen: [
    { to: '/citizen/my-challenges', label: 'My Problems', icon: '📋' },
    { to: '/citizen/submit-challenge', label: 'Submit Problem', icon: '✉' },
  ],
  gov_admin: [
    { group: 'MAIN', items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: '◼' },
    ]},
    { group: 'ECOSYSTEM', items: [
      { to: '/admin/challenges', label: 'Challenges', icon: '📁' },
      { to: '/admin/universities', label: 'Universities', icon: '🎓' },
      { to: '/admin/industry', label: 'Industry Partners', icon: '🏭' },
    ]},
    { group: 'MANAGEMENT', items: [
      { to: '/admin/users', label: 'Users', icon: '👥' },
    ]},
    { group: 'SYSTEM', items: [
      { to: '/admin/master-data', label: 'Master Data', icon: '⚙️' },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
    ]},
  ],
  hei_spoc: [
    { to: '/hei/assigned-challenges', label: 'Assigned Challenges', icon: '📥' },
    { to: '/hei/my-teams', label: 'My Teams', icon: '👥' },
  ],
  faculty_mentor: [
    { to: '/faculty/my-teams', label: 'My Teams', icon: '👥' },
  ],
  industry_partner: [
    { to: '/industry/browse-projects', label: 'Browse Projects', icon: '🔍' },
    { to: '/industry/partnerships', label: 'My Partnerships', icon: '🤝' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const navItems = NAV_ITEMS[user.role] || []
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Render group or flat items
  const renderNavItems = () => {
    if (user.role === 'gov_admin') {
      return navItems.map((group, idx) => (
        <div key={idx} className="sidebar-group">
          <div className="sidebar-group-title" style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', marginTop: '16px', paddingLeft: '12px' }}>
            {group.group}
          </div>
          {group.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))
    }

    // Flat structure for other roles
    return navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `sidebar-nav-item${isActive ? ' active' : ''}`
        }
      >
        <span>{item.icon}</span>
        {item.label}
      </NavLink>
    ))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">SamadhanX</div>
        <div className="sidebar-brand-sub">Societal Innovation Portal · SIH 26043</div>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems()}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">
              {user.first_name} {user.last_name}
            </div>
            <div className="sidebar-user-role">{ROLE_LABEL[user.role]}</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
