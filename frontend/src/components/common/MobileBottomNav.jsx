// Mobile bottom navigation — only visible on citizen mobile
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileBottomNav() {
  const { user } = useAuth()
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

        <NavLink
          to="/citizen/profile"
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </NavLink>
      </div>
    </nav>
  )
}
