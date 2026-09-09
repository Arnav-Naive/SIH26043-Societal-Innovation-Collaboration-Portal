import { useState, useEffect } from 'react'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getPendingHEIs, actionHEI } from '../../api/universities'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminHEIApprovals() {
  const [heis, setHeis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedHei, setSelectedHei] = useState(null)
  
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const loadPending = async () => {
    try {
      setLoading(true)
      const res = await getPendingHEIs()
      setHeis(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch {
      setError('Unable to load pending HEI applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPending() }, [])

  const handleApprove = async () => {
    if (!window.confirm('Approve this institution? The SPOC account will be activated.')) return
    setActionLoading(true)
    try {
      await actionHEI(selectedHei.id, { action: 'approve' })
      setSelectedHei(null)
      loadPending()
    } catch {
      alert('Failed to approve.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    setActionLoading(true)
    try {
      await actionHEI(selectedHei.id, { action: 'reject', reason: rejectReason })
      setSelectedHei(null)
      setShowRejectInput(false)
      setRejectReason('')
      loadPending()
    } catch {
      alert('Failed to reject.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && heis.length === 0) {
    return <div><TopHeader title="HEI Approvals" /><div className="page-content"><LoadingPage /></div></div>
  }

  return (
    <div>
      <TopHeader title="Pending HEI Verifications" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">HEI Approvals</h1>
          <p className="page-subtitle">Review and verify new University/Institution registration applications.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && heis.length === 0 ? (
          <EmptyState
            icon="🏛️"
            title="No Pending Applications"
            subtitle="All HEI registration requests have been processed."
          />
        ) : (
          <div className="grid-2">
            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {heis.map(hei => (
                <div 
                  key={hei.id} 
                  className={`card ${selectedHei?.id === hei.id ? 'active' : ''}`}
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedHei?.id === hei.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    padding: 16
                  }}
                  onClick={() => { setSelectedHei(hei); setShowRejectInput(false); setRejectReason(''); }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{hei.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                    {hei.institution_type} • {hei.district_name}, {hei.state}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    Applied: {formatDate(hei.created_at)}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail View */}
            <div>
              {selectedHei ? (
                <div className="card" style={{ position: 'sticky', top: 20 }}>
                  <div className="card-header">
                    <span className="card-title">Application Details</span>
                  </div>
                  <div className="card-body">
                    <div className="detail-section-title">Institution Info</div>
                    <div className="detail-row">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{selectedHei.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{selectedHei.institution_type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Registration ID</span>
                      <span className="detail-value">{selectedHei.registration_id || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Website</span>
                      <span className="detail-value">
                        {selectedHei.website ? <a href={selectedHei.website} target="_blank" rel="noreferrer">{selectedHei.website}</a> : '—'}
                      </span>
                    </div>

                    <div className="detail-section-title" style={{ marginTop: 20 }}>Location & Facilities</div>
                    <div className="detail-row">
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{selectedHei.address}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Departments</span>
                      <span className="detail-value">{selectedHei.departments || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Facilities</span>
                      <span className="detail-value">{selectedHei.facilities || '—'}</span>
                    </div>

                    <div className="detail-section-title" style={{ marginTop: 20 }}>Authorized SPOC</div>
                    <div className="detail-row">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{selectedHei.spoc_name} ({selectedHei.designation})</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedHei.spoc_email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{selectedHei.spoc_phone}</span>
                    </div>

                    <div className="detail-section-title" style={{ marginTop: 20 }}>Verification</div>
                    <div style={{ marginBottom: 20 }}>
                      {selectedHei.verification_document ? (
                        <a href={selectedHei.verification_document} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          📄 View Uploaded Authorization Document
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-danger)', fontSize: 13, fontWeight: 600 }}>No document uploaded</span>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                      {!showRejectInput ? (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                            {actionLoading ? 'Processing...' : 'Approve Application'}
                          </button>
                          <button className="btn btn-danger" onClick={() => setShowRejectInput(true)} disabled={actionLoading}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ background: '#fff5f5', padding: 16, borderRadius: 8, border: '1px solid #fed7d7' }}>
                          <label className="form-label" style={{ color: '#c53030' }}>Reason for Rejection <span className="required">*</span></label>
                          <textarea 
                            className="form-control" 
                            rows={3} 
                            value={rejectReason} 
                            onChange={e => setRejectReason(e.target.value)} 
                            placeholder="Explain why this application is being rejected. This will be visible if they try to log in."
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading}>Confirm Rejection</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
                  Select an application from the list to view details and process verification.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
