import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ProtectedRoute, PublicRoute, getRoleHome } from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import LoadingPage from '../components/common/LoadingPage'

// Lazy load pages for performance
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))

const MyChallenges = lazy(() => import('../pages/citizen/MyChallenges'))
const SubmitChallenge = lazy(() => import('../pages/citizen/SubmitChallenge'))
const CitizenChallengeDetail = lazy(() => import('../pages/citizen/ChallengeDetail'))

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const AdminChallengeDetail = lazy(() => import('../pages/admin/ChallengeDetail'))
const AdminDataTablePage = lazy(() => import('../pages/admin/AdminDataTablePage'))

const AssignedChallenges = lazy(() => import('../pages/hei/AssignedChallenges'))
const FormTeam = lazy(() => import('../pages/hei/FormTeam'))
const HEIMyTeams = lazy(() => import('../pages/hei/MyTeams'))
const HEITeamDetail = lazy(() => import('../pages/hei/TeamDetail'))

const FacultyMyTeams = lazy(() => import('../pages/faculty/MyTeams'))
const FacultyTeamDetail = lazy(() => import('../pages/faculty/TeamDetail'))

const BrowseProjects = lazy(() => import('../pages/industry/BrowseProjects'))
const MyPartnerships = lazy(() => import('../pages/industry/MyPartnerships'))

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHome(user.role)} replace />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth (public) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Citizen */}
        <Route path="/citizen/my-challenges" element={
          <ProtectedRoute allowedRoles={['citizen']}><MyChallenges /></ProtectedRoute>
        } />
        <Route path="/citizen/submit-challenge" element={
          <ProtectedRoute allowedRoles={['citizen']}><SubmitChallenge /></ProtectedRoute>
        } />
        <Route path="/citizen/challenges/:id" element={
          <ProtectedRoute allowedRoles={['citizen']}><CitizenChallengeDetail /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/challenges" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/challenges/:id" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminChallengeDetail /></ProtectedRoute>
        } />
        <Route path="/admin/:entity" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminDataTablePage /></ProtectedRoute>
        } />

        {/* HEI */}
        <Route path="/hei/assigned-challenges" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><AssignedChallenges /></ProtectedRoute>
        } />
        <Route path="/hei/challenges/:id/form-team" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><FormTeam /></ProtectedRoute>
        } />
        <Route path="/hei/challenges/:id" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><AssignedChallenges /></ProtectedRoute>
        } />
        <Route path="/hei/my-teams" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><HEIMyTeams /></ProtectedRoute>
        } />
        <Route path="/hei/teams/:id" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><HEITeamDetail /></ProtectedRoute>
        } />

        {/* Faculty */}
        <Route path="/faculty/my-teams" element={
          <ProtectedRoute allowedRoles={['faculty_mentor']}><FacultyMyTeams /></ProtectedRoute>
        } />
        <Route path="/faculty/teams/:id" element={
          <ProtectedRoute allowedRoles={['faculty_mentor']}><FacultyTeamDetail /></ProtectedRoute>
        } />

        {/* Industry */}
        <Route path="/industry/browse-projects" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><BrowseProjects /></ProtectedRoute>
        } />
        <Route path="/industry/partnerships" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><MyPartnerships /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40 }}>404</div>
            <h2 style={{ color: 'var(--gray-700)' }}>Page Not Found</h2>
            <a href="/" style={{ color: 'var(--color-primary)' }}>Go Home</a>
          </div>
        } />
      </Routes>
    </Suspense>
  )
}
