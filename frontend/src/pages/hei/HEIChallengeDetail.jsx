import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'

export default function HEIChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    axiosClient.get(`/challenges/${id}/`)
      .then(res => setChallenge(res.data))
      .catch(err => {
        console.error(err)
        alert('Could not load challenge details')
        navigate('/hei/assigned-challenges')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleAction = async (action) => {
    if (action === 'reject' && !rejectReason) {
      alert('Please provide a reason for rejection.')
      return
    }

    setActionLoading(true)
    try {
      await axiosClient.post(`/universities/challenges/${id}/action/`, { action, reason: rejectReason })
      alert(`Challenge ${action}ed successfully!`)
      if (action === 'accept') {
        navigate(`/hei/challenges/${id}/form-team`)
      } else {
        navigate('/hei/assigned-challenges')
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'An error occurred.')
    } finally {
      setActionLoading(false)
      setShowRejectModal(false)
    }
  }

  if (loading) return <div><TopHeader title="Challenge Details" /><LoadingPage /></div>
  if (!challenge) return null

  return (
    <div>
      <TopHeader title={`Challenge ${challenge.reference_id}`} />
      <div className="page-content" style={{ maxWidth: 800 }}>
        
        <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/hei/assigned-challenges')}>
          ← Back to Assigned Challenges
        </button>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>{challenge.title}</h1>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                Reference: <strong>{challenge.reference_id}</strong> | Submitted by: Citizen
              </div>
            </div>
            <StatusBadge value={challenge.status} />
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{challenge.category || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>District</div>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{challenge.district}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Priority</div>
                <div style={{ marginTop: 4 }}><StatusBadge value={challenge.priority} /></div>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--gray-800)' }}>Problem Statement</h3>
            <p style={{ color: 'var(--gray-700)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 24 }}>
              {challenge.description}
            </p>

            {(challenge.photos?.length > 0 || challenge.videos?.length > 0) && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gray-800)' }}>Attached Evidence</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {challenge.photos?.map(p => (
                    <img key={p.id} src={p.image} alt="Evidence" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  ))}
                  {challenge.videos?.map(v => (
                    <video key={v.id} src={v.video} controls style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  ))}
                </div>
              </div>
            )}

            {challenge.status === 'ROUTED' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 24, display: 'flex', gap: 12 }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleAction('accept')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Accept Challenge & Form Team'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  Reject Challenge
                </button>
              </div>
            )}

            {challenge.status === 'ACCEPTED' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 24 }}>
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  You have accepted this challenge. Next step is to form a project team.
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate(`/hei/challenges/${id}/form-team`)}
                >
                  Form Project Team
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: 400, maxWidth: '90%' }}>
              <div className="card-header">
                <h3 className="card-title">Reject Challenge</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>Please provide a reason for rejecting this challenge. This will be visible to the government administrators.</p>
                <textarea
                  className="form-control"
                  rows={4}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (e.g., lack of expertise, capacity)..."
                  style={{ width: '100%', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ background: 'var(--color-danger)' }} onClick={() => handleAction('reject')} disabled={actionLoading}>
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
