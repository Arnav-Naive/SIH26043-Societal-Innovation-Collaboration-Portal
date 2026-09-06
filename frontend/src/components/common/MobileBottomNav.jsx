// Mobile bottom navigation — only visible on citizen mobile
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileBottomNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user || user.role !== 'citizen') return null

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        <NavLink
          to="/citizen/my-challenges"
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Problems
        </NavLink>

        <NavLink
          to="/citizen/submit-challenge"
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit
        </NavLink>

        <button
          className="mobile-nav-item"
          onClick={async () => { await logout(); navigate('/login') }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
