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
  const { user } = useAuth()
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
      <div className="top-header-title">{title}</div>

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
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, width: '350px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '400px', overflowY: 'auto', marginTop: '8px' }}>
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

          <div className="notifications-container" ref={notifRef} style={{ position: 'relative' }}>
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
              <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, width: '300px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '400px', overflowY: 'auto', marginTop: '8px' }}>
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

          <Link to="/admin/profile" className="top-header-user" style={{ textDecoration: 'none', color: 'inherit' }}>
            {user.first_name} {user.last_name}
          </Link>
          <span className="top-header-role-badge">
            {ROLE_LABEL[user.role] || user.role}
          </span>
        </div>
      )}
    </header>
  )
}
