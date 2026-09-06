import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { browseProjects, offerSupport } from '../../api/industry'

const SUPPORT_TYPES = [
  { value: 'MENTORSHIP', label: 'Mentorship' },
  { value: 'FUNDING', label: 'Funding' },
  { value: 'PILOT', label: 'Pilot Support' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'OTHER', label: 'Other' },
]

function OfferSupportModal({ team, onClose, onSuccess }) {
  const [form, setForm] = useState({ support_type: 'MENTORSHIP', contribution_details: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.contribution_details.trim()) {
      setError('Please describe your contribution.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await offerSupport(team.id, form)
      onSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit support offer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Offer Support</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 6, marginBottom: 20, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{team.challenge?.title}</div>
            <div style={{ color: 'var(--gray-500)' }}>{team.university?.name} · 📍 {team.challenge?.district}</div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} id="support-form">
            <div className="form-group">
              <label className="form-label" htmlFor="sup-type">Support Type <span className="required">*</span></label>
              <select id="sup-type" className="form-control" value={form.support_type}
                onChange={e => setForm(f => ({ ...f, support_type: e.target.value }))}>
                {SUPPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sup-details">Contribution Details <span className="required">*</span></label>
              <textarea id="sup-details" className="form-control" rows={5}
                value={form.contribution_details}
                onChange={e => setForm(f => ({ ...f, contribution_details: e.target.value }))}
                placeholder="Describe what support you are offering — funding amount, mentorship scope, pilot facility details, etc." />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="support-form" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : 'Submit Support Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [filters, setFilters] = useState({ sector: '', district: '' })
  const [pendingFilters, setPendingFilters] = useState({ sector: '', district: '' })

  const loadProjects = (params = {}) => {
    setLoading(true)
    browseProjects(params)
      .then(({ data }) => setProjects(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError('Unable to load projects.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    loadProjects(pendingFilters)
  }

  const handleSupportSuccess = (data) => {
    setSelectedTeam(null)
    setSuccessMsg('Support offer submitted successfully. The team will be notified.')
  }

  if (loading && projects.length === 0) return (
    <div><TopHeader title="Browse Projects" /><div className="page-content"><LoadingPage /></div></div>
  )

  return (
    <div>
      <TopHeader title="Browse Projects" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Browse Projects</h1>
          <p className="page-subtitle">Find active projects that would benefit from your support.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Filters */}
        <form onSubmit={handleFilterSubmit}>
          <div className="filters-bar">
            <div className="form-group">
              <label className="form-label">Sector / Category</label>
              <select className="form-control" value={pendingFilters.sector}
                onChange={e => setPendingFilters(f => ({ ...f, sector: e.target.value }))}>
                <option value="">All Sectors</option>
                {['Water','Agriculture','Education','Health','Infrastructure','Environment','Governance'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <input className="form-control" placeholder="Filter by district..."
                value={pendingFilters.district}
                onChange={e => setPendingFilters(f => ({ ...f, district: e.target.value }))} />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Filter</button>
            </div>
          </div>
        </form>

        {projects.length === 0 && !loading ? (
          <EmptyState
            icon="🔍"
            title="No projects currently require support"
            subtitle="Check back later or adjust your filters."
          />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {projects.map((team) => (
              <div key={team.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{team.challenge?.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                      {team.university?.name} · 📍 {team.challenge?.district} · {team.challenge?.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <StatusBadge value={team.challenge?.priority} />
                    <StatusBadge value={team.challenge?.status} />
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid-2" style={{ marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        <strong>Current Stage:</strong> {team.stage}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        <strong>Faculty Mentor:</strong>{' '}
                        {team.faculty_mentor
                          ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        <strong>Team Size:</strong> {team.students?.length || 0} students
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        <strong>Partnerships:</strong> {team.partnerships_count || 0} active
                      </div>
                    </div>
                  </div>

                  {team.project_description && (
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {team.project_description}
                    </p>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      Offer Support
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeam && (
        <OfferSupportModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onSuccess={handleSupportSuccess}
        />
      )}
    </div>
  )
}
