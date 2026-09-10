import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingPage from '../components/common/LoadingPage'

// Protect routes by role
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingPage />

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  // Force citizens to select language
  if (user.role === 'citizen' && !user.preferred_language && location.pathname !== '/citizen/language-setup') {
    return <Navigate to="/citizen/language-setup" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => window.location.href = getRoleHome(user.role)} className="btn btn-primary">Go to My Dashboard</button>
      </div>
    )
  }

  return children
}

// Redirect authenticated users away from login/register
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingPage />
  if (user) {
    const searchParams = new URLSearchParams(location.search)
    const nextUrl = searchParams.get('next')
    return <Navigate to={nextUrl || getRoleHome(user.role)} replace />
  }
  return children
}

export function getRoleHome(role) {
  const map = {
    citizen: '/citizen/dashboard',
    gov_admin: '/admin/dashboard',
    hei_spoc: '/hei/assigned-challenges',
    faculty_mentor: '/faculty/my-teams',
    industry_partner: '/industry/dashboard',
  }
  return map[role] || '/login'
}
