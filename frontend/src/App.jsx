import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import Sidebar from './components/common/Sidebar'
import MobileBottomNav from './components/common/MobileBottomNav'
import { useAuth } from './context/AuthContext'
import './index.css'

function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return null

  // Auth pages don't get sidebar/layout
  if (!user) return <AppRoutes />

  const isCitizen = user.role === 'citizen'

  return (
    <div className={`app-shell ${isCitizen ? 'citizen-shell' : ''}`}>
      {!isCitizen && <Sidebar />}
      <main className={`main-content ${isCitizen ? 'citizen-content' : ''}`}>
        <AppRoutes />
      </main>
      <MobileBottomNav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
