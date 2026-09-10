import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, updateProfile } from '../../api/auth'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import { useAuth } from '../../context/AuthContext'
import { SUPPORTED_LANGUAGES } from '../../utils/translations'

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    organization: '',
    password: '',
    preferred_language: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await getMe()
      setProfile({
        ...res.data,
        password: '' // Don't populate password
      })
      setError('')
    } catch (err) {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await updateProfile(profile)
      setSuccess('Profile updated successfully.')
      setProfile(prev => ({ ...prev, password: '' })) // Clear password field on success
      
      // Update local storage and force reload so AuthContext picks up the new language
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data))
        window.location.reload()
      }
    } catch (err) {
      setError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value })
  }

  if (loading) return <LoadingPage />

  return (
    <div>
      <TopHeader title="My Profile" />
      
      <div className="page-content" style={{ padding: '24px 16px', maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Profile Hero Header */}
        <div 
          className="page-header"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(15, 81, 50, 0.95), rgba(20, 45, 29, 0.7)), url('/images/jharkhand_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            padding: '40px 32px',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          {/* Avatar Circle */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold',
            border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0
          }}>
            {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h1 className="page-title" style={{ color: '#ffffff', fontSize: '2rem', letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.4)', marginBottom: '4px' }}>
              {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'My Profile'}
            </h1>
            <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', marginTop: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              Manage your personal information and account settings.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 24 }}>{success}</div>}
        
        <form onSubmit={handleSave} className="card" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Personal Information</h3>
          </div>
          
          <div className="grid-2" style={{ marginBottom: 16, gap: '16px 24px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Username</label>
              <input 
                type="text" 
                className="form-control"
                style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                value={profile.username || ''}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                className="form-control"
                style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                value={profile.email || ''}
                disabled
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16, gap: '16px 24px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>First Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Last Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 32, gap: '16px 24px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Phone Number</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Organization / Department</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.organization || ''}
                onChange={(e) => handleChange('organization', e.target.value)}
              />
            </div>
          </div>

          {user?.role === 'citizen' && (
            <>
              <div style={{ height: 1, background: 'var(--gray-200)', margin: '32px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌐</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Language Settings</h3>
              </div>
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Preferred Language</label>
                <select 
                  className="form-control"
                  value={profile.preferred_language || ''}
                  onChange={(e) => handleChange('preferred_language', e.target.value)}
                >
                  <option value="" disabled>Select a language</option>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.label})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ height: 1, background: 'var(--gray-200)', margin: '32px 0' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Security</h3>
          </div>
          
          <div className="form-group" style={{ marginBottom: 40 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>New Password (leave blank to keep current password)</label>
            <input 
              type="password" 
              className="form-control"
              value={profile.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: 'var(--gray-50)', padding: '20px -32px', margin: '0 -32px -32px -32px', borderTop: '1px solid var(--gray-200)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingLeft: 32, paddingRight: 32 }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={async () => { await logout(); navigate('/login') }}
              style={{ color: 'var(--color-danger)', fontWeight: 600 }}
            >
              Sign Out
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '12px 24px', fontSize: 16 }}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
