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
    { to: '/citizen/dashboard', label: 'Dashboard', icon: '◼' },
    { to: '/citizen/my-challenges', label: 'My Problems', icon: '📋' },
    { to: '/citizen/submit-challenge', label: 'Report Problem', icon: '✉' },
    { to: '/citizen/profile', label: 'My Profile', icon: '👤' },
  ],
  gov_admin: [
    { group: 'MAIN', items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: '◼' },
      { to: '/admin/reports', label: 'Reports & Exports', icon: '📊' },
    ]},
    { group: 'ECOSYSTEM', items: [
      { to: '/admin/problem-twins', label: 'Problem Twins', icon: '🧬' },
      { to: '/admin/challenges', label: 'Challenges', icon: '📁' },
      { to: '/admin/duplicate-review', label: 'Duplicate Review', icon: '🔀' },
      { to: '/admin/hei-approvals', label: 'HEI Approvals', icon: '🏛️' },
      { to: '/admin/universities', label: 'Universities', icon: '🎓' },
      { to: '/admin/industry', label: 'Industry Partners', icon: '🏭' },
    ]},
    { group: 'MANAGEMENT', items: [
      { to: '/admin/users', label: 'Users', icon: '👥' },
    ]},
    { group: 'SYSTEM', items: [
      { to: '/admin/master-data', label: 'Master Data', icon: '⚙️' },
      { to: '/admin/ai-config', label: 'AI Configuration', icon: '🧠' },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
    ]},
  ],
  hei_spoc: [
    { to: '/hei/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/hei/assigned-challenges', label: 'Assigned Challenges', icon: '📥' },
    { to: '/hei/my-teams', label: 'My Projects', icon: '🚀' },
  ],
  faculty_mentor: [
    { to: '/faculty/my-teams', label: 'My Teams', icon: '👥' },
  ],
  industry_partner: [
    { to: '/industry/browse-projects', label: 'Browse Projects', icon: '🔍' },
    { to: '/industry/partnerships', label: 'My Partnerships', icon: '🤝' },
    { to: '/industry/impact', label: 'Impact Summary', icon: '📈' },
    { to: '/industry/notifications', label: 'Notifications', icon: '🔔' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const navItems = NAV_ITEMS[user.role] || []
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase()

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
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
        <img src="/images/logo.png" alt="SamadhanX Logo" style={{ width: '100%', maxWidth: '180px', objectFit: 'contain' }} />
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
      </div>
    </aside>
  )
}
