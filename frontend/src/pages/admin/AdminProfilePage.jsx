import { useState, useEffect } from 'react'
import { getMe, updateProfile } from '../../api/auth'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    organization: '',
    password: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { logout } = useAuth()
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
      await updateProfile(profile)
      setSuccess('Profile updated successfully.')
      setProfile(prev => ({ ...prev, password: '' })) // Clear password field on success
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
      
      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSave} className="card" style={{ maxWidth: '600px', padding: '24px' }}>
          <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>Personal Information</h3>
          
          <div className="form-group mb-4">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control"
              style={{ background: 'var(--gray-100)' }}
              value={profile.username}
              disabled
            />
          </div>

          <div className="form-group mb-4">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control"
              style={{ background: 'var(--gray-100)' }}
              value={profile.email}
              disabled
            />
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label>Phone Number</label>
            <input 
              type="text" 
              className="form-control"
              value={profile.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="form-group mb-6">
            <label>Organization / Department</label>
            <input 
              type="text" 
              className="form-control"
              value={profile.organization || ''}
              onChange={(e) => handleChange('organization', e.target.value)}
            />
          </div>

          <h3 style={{ marginBottom: 16, marginTop: 24, paddingTop: 24, fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border-color)', color: 'var(--gray-900)' }}>Security</h3>
          <div className="form-group mb-6">
            <label>New Password (leave blank to keep current password)</label>
            <input 
              type="password" 
              className="form-control"
              value={profile.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button 
              type="button" 
              className="btn" 
              onClick={async () => { await logout(); navigate('/login') }}
              style={{ background: 'var(--danger-bg)', color: 'var(--color-danger)' }}
            >
              Sign Out
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
