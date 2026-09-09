import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/auth'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function CitizenNotificationsPage() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifs()
  }, [])

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications()
      setNotifs(Array.isArray(res.data) ? res.data : (res.data.results || []))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifs(notifs.map(n => ({ ...n, is_read: true })))
  }

  const handleRead = async (id) => {
    await markNotificationRead(id)
    setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  if (loading) return <div><TopHeader title="Notifications" /><div className="page-content"><LoadingPage /></div></div>

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div>
      <TopHeader title="Notifications" />
      <div className="page-content" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--gray-900)' }}>Notifications</h2>
          {unreadCount > 0 && (
            <button className="btn btn-ghost" onClick={handleMarkAllRead} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Mark all read
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--gray-900)' }}>You're all caught up!</h3>
            <p style={{ margin: 0 }}>There are no notifications at the moment.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {notifs.map((n, idx) => (
              <div 
                key={n.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: idx === notifs.length - 1 ? 'none' : '1px solid var(--border-color)',
                  background: n.is_read ? '#fff' : 'var(--success-light)',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: n.is_read ? 600 : 700, color: 'var(--gray-900)', marginBottom: 4 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 8 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                      {formatDate(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />}
                </div>

                {n.link && (
                  <div style={{ marginTop: 12 }}>
                    <Link 
                      to={n.link} 
                      onClick={() => !n.is_read && handleRead(n.id)}
                      className="btn btn-primary" 
                      style={{ padding: '6px 16px', fontSize: 12 }}
                    >
                      View Details →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
