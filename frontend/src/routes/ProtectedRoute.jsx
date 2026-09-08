import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingPage from '../components/common/LoadingPage'

// Protect routes by role
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingPage />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🚫</div>
        <h2 style={{ fontSize: 20, color: 'var(--gray-700)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
          You do not have permission to access this page.
        </p>
        <Navigate to={getRoleHome(user.role)} replace />
      </div>
    )
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
