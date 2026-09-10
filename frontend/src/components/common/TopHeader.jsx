import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/auth'
import { globalSearch } from '../../api/analytics'

const ROLE_LABEL = {
  citizen: 'Citizen',
  hei_spoc: 'HEI SPOC',
  faculty_mentor: 'Faculty Mentor',
  industry_partner: 'Industry Partner',
  gov_admin: 'Government Admin',
}

export default function TopHeader({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (user) {
      getNotifications()
        .then(res => setNotifs(Array.isArray(res.data) ? res.data : (res.data.results || [])))
        .catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (e) => {
    const q = e.target.value
    setSearchQuery(q)
    if (!q) {
      setSearchResults([])
      setShowSearch(false)
      return
    }
    setShowSearch(true)
    setIsSearching(true)
    try {
      const res = await globalSearch(q)
      setSearchResults(res.data)
    } catch {
      // ignore
    } finally {
      setIsSearching(false)
    }
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <header className="top-header">
      <div className="top-header-left">
        {(!user || user.role !== 'citizen') && (
          <button 
            className="mobile-header-hamburger btn-ghost" 
            onClick={() => {
              const sb = document.querySelector('.sidebar')
              if (sb) sb.classList.toggle('open')
            }}
            style={{ padding: '8px', marginRight: '8px', border: 'none', background: 'transparent' }}
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate(user?.role === 'citizen' ? '/' : `/${user?.role}/dashboard`)}>
          <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>SX</div>
          <span className="top-header-title" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary-dark)' }}>SAMAdhan</span>
            {user?.role === 'citizen' && <span className="desktop-only" style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 500 }}>People's Problems. Academic Solutions.</span>}
          </span>
        </div>
      </div>

      {user?.role === 'citizen' && (
        <nav className="desktop-only" style={{ display: 'flex', gap: '24px', alignItems: 'center', margin: '0 auto' }}>
          <Link to="/" style={{ color: 'var(--gray-700)', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>Home</Link>
          <Link to="/citizen/submit-challenge" style={{ color: 'var(--gray-700)', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>Report a Problem</Link>
          <Link to="/citizen/my-challenges" style={{ color: 'var(--gray-700)', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>My Problems</Link>
        </nav>
      )}

      {user && (
        <div className="top-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {user.role === 'gov_admin' && (
            <div className="global-search-container" ref={searchRef} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Global Search..."
                className="form-control"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => { if(searchQuery) setShowSearch(true) }}
                style={{ width: '250px', borderRadius: '20px', padding: '6px 16px' }}
              />
              {showSearch && (
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, width: '350px', maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '400px', overflowY: 'auto', marginTop: '8px' }}>
                  {isSearching ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#888' }}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(res => (
                      <div key={`${res.type}-${res.id}`} style={{ padding: '10px 16px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { setShowSearch(false); navigate(res.link); }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, marginBottom: '4px' }}>{res.type}</div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{res.title}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Status: {res.status}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#888' }}>No results found</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`notifications-container ${user.role === 'citizen' ? 'desktop-only' : ''}`} ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ position: 'relative', padding: '8px' }}
              onClick={() => setShowNotifs(!showNotifs)}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0', right: '0', background: 'red', color: 'white', borderRadius: '50%', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, width: '300px', maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '400px', overflowY: 'auto', marginTop: '8px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button className="btn btn-sm btn-ghost" onClick={async () => {
                      await markAllNotificationsRead()
                      setNotifs(Array.isArray(notifs) ? notifs.map(n => ({ ...n, is_read: true })) : [])
                    }} style={{ fontSize: '12px', color: 'var(--color-primary)' }}>Mark all read</button>
                  )}
                </div>
                {notifs.length > 0 ? notifs.map(n => (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: n.is_read ? '#fff' : '#f0fdf4' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{n.message}</div>
                    {n.link && (
                      <Link to={n.link} style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '8px', display: 'inline-block' }} onClick={async () => {
                        if (!n.is_read) {
                          await markNotificationRead(n.id)
                          setNotifs(notifs.map(x => x.id === n.id ? { ...x, is_read: true } : x))
                        }
                        setShowNotifs(false)
                      }}>View Details →</Link>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No notifications</div>
                )}
              </div>
            )}
          </div>

          <Link to={user.role === 'citizen' ? '/citizen/profile' : '/profile'} className="top-header-user desktop-only" style={{ textDecoration: 'none', color: 'inherit' }}>
            {user.first_name} {user.last_name}
          </Link>
          <span className="top-header-role-badge desktop-only">
            {ROLE_LABEL[user.role] || user.role}
          </span>
          <button
            className="btn btn-ghost desktop-only"
            style={{ color: 'var(--color-danger)', padding: '6px 12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            title="Sign Out"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </header>
  )
}
