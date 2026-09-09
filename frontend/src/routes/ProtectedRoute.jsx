import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingPage from '../components/common/LoadingPage'

// Protect routes by role
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingPage />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: send user to their own home instead of showing an error
    return <Navigate to={getRoleHome(user.role)} replace />
  }

  return children
}

// Redirect authenticated users away from login/register
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (user) return <Navigate to={getRoleHome(user.role)} replace />
  return children
}

export function getRoleHome(role) {
  const map = {
    citizen: '/citizen/dashboard',
    gov_admin: '/admin/dashboard',
    hei_spoc: '/hei/assigned-challenges',
    faculty_mentor: '/faculty/my-teams',
    industry_partner: '/industry/browse-projects',
  }
  return map[role] || '/login'
}
