import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ProtectedRoute, PublicRoute, getRoleHome } from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import LoadingPage from '../components/common/LoadingPage'

// Lazy load pages for performance
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const HEIRegister = lazy(() => import('../pages/auth/HEIRegister'))

const CitizenDashboard = lazy(() => import('../pages/citizen/Dashboard'))
const MyChallenges = lazy(() => import('../pages/citizen/MyChallenges'))
const SubmitChallenge = lazy(() => import('../pages/citizen/SubmitChallenge'))
const CitizenChallengeDetail = lazy(() => import('../pages/citizen/ChallengeDetail'))
const CitizenNotificationsPage = lazy(() => import('../pages/citizen/CitizenNotificationsPage'))
const LanguageSelection = lazy(() => import('../pages/citizen/LanguageSelection'))

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const AdminChallengeDetail = lazy(() => import('../pages/admin/ChallengeDetail'))
const AdminDataTablePage = lazy(() => import('../pages/admin/AdminDataTablePage'))
const DuplicateReview = lazy(() => import('../pages/admin/DuplicateReview'))
const ProblemTwinList = lazy(() => import('../pages/admin/ProblemTwinList'))
const ProblemTwinDetail = lazy(() => import('../pages/admin/ProblemTwinDetail'))
const AIConfigPage = lazy(() => import('../pages/admin/AIConfigPage'))
const AdminProfilePage = lazy(() => import('../pages/admin/AdminProfilePage'))
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'))
const AdminHEIApprovals = lazy(() => import('../pages/admin/AdminHEIApprovals'))

const HEIDashboard = lazy(() => import('../pages/hei/HEIDashboard'))
const AssignedChallenges = lazy(() => import('../pages/hei/AssignedChallenges'))
const HEIChallengeDetail = lazy(() => import('../pages/hei/HEIChallengeDetail'))
const FormTeam = lazy(() => import('../pages/hei/FormTeam'))
const HEIMyTeams = lazy(() => import('../pages/hei/MyTeams'))
const HEITeamDetail = lazy(() => import('../pages/hei/TeamDetail'))

const FacultyMyTeams = lazy(() => import('../pages/faculty/MyTeams'))
const FacultyTeamDetail = lazy(() => import('../pages/faculty/TeamDetail'))

const BrowseProjects = lazy(() => import('../pages/industry/BrowseProjects'))
const MyPartnerships = lazy(() => import('../pages/industry/MyPartnerships'))
const PartnershipDetail = lazy(() => import('../pages/industry/PartnershipDetail'))
const ImpactSummary = lazy(() => import('../pages/industry/ImpactSummary'))
const IndustryDashboard = lazy(() => import('../pages/industry/Dashboard'))
const MyContributions = lazy(() => import('../pages/industry/MyContributions'))
const ContributionHistory = lazy(() => import('../pages/industry/ContributionHistory'))

const LandingPage = lazy(() => import('../pages/public/LandingPage'))

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHome(user.role)} replace />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth (public) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/register-hei" element={<PublicRoute><HEIRegister /></PublicRoute>} />

        {/* Citizen */}
        <Route path="/citizen/dashboard" element={
          <ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>
        } />
        <Route path="/citizen/my-challenges" element={
          <ProtectedRoute allowedRoles={['citizen']}><MyChallenges /></ProtectedRoute>
        } />
        <Route path="/citizen/submit-challenge" element={
          <ProtectedRoute allowedRoles={['citizen']}><SubmitChallenge /></ProtectedRoute>
        } />
        <Route path="/citizen/challenges/:id" element={
          <ProtectedRoute allowedRoles={['citizen']}><CitizenChallengeDetail /></ProtectedRoute>
        } />
        <Route path="/citizen/profile" element={
          <ProtectedRoute allowedRoles={['citizen']}><AdminProfilePage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['gov_admin', 'hei_spoc', 'faculty_mentor', 'industry_partner']}><AdminProfilePage /></ProtectedRoute>
        } />
        <Route path="/citizen/notifications" element={
          <ProtectedRoute allowedRoles={['citizen']}><CitizenNotificationsPage /></ProtectedRoute>
        } />
        <Route path="/citizen/language-setup" element={
          <ProtectedRoute allowedRoles={['citizen']}><LanguageSelection /></ProtectedRoute>
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
        <Route path="/admin/duplicate-review" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><DuplicateReview /></ProtectedRoute>
        } />
        <Route path="/admin/problem-twins" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><ProblemTwinList /></ProtectedRoute>
        } />
        <Route path="/admin/problem-twins/:id" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><ProblemTwinDetail /></ProtectedRoute>
        } />
        <Route path="/admin/ai-config" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AIConfigPage /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminReportsPage /></ProtectedRoute>
        } />
        <Route path="/admin/hei-approvals" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminHEIApprovals /></ProtectedRoute>
        } />
        <Route path="/admin/:entity" element={
          <ProtectedRoute allowedRoles={['gov_admin']}><AdminDataTablePage /></ProtectedRoute>
        } />

        {/* HEI */}
        <Route path="/hei/dashboard" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><HEIDashboard /></ProtectedRoute>
        } />
        <Route path="/hei/assigned-challenges" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><AssignedChallenges /></ProtectedRoute>
        } />
        <Route path="/hei/challenges/:id" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><HEIChallengeDetail /></ProtectedRoute>
        } />
        <Route path="/hei/challenges/:id/form-team" element={
          <ProtectedRoute allowedRoles={['hei_spoc']}><FormTeam /></ProtectedRoute>
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
        <Route path="/industry/dashboard" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><IndustryDashboard /></ProtectedRoute>
        } />
        <Route path="/industry/browse-projects" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><BrowseProjects /></ProtectedRoute>
        } />
        <Route path="/industry/partnerships" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><MyPartnerships /></ProtectedRoute>
        } />
        <Route path="/industry/partnerships/:id" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><PartnershipDetail /></ProtectedRoute>
        } />
        <Route path="/industry/contributions" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><MyContributions /></ProtectedRoute>
        } />
        <Route path="/industry/contribution-history" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><ContributionHistory /></ProtectedRoute>
        } />
        <Route path="/industry/impact" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><ImpactSummary /></ProtectedRoute>
        } />
        <Route path="/industry/notifications" element={
          <ProtectedRoute allowedRoles={['industry_partner']}><CitizenNotificationsPage /></ProtectedRoute>
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
