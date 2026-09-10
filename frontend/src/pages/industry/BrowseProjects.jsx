import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IndustryLayout from '../../components/industry/IndustryLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { browseProjects, offerSupport } from '../../api/industry'

const SUPPORT_TYPES = [
  { value: 'FUNDING', label: 'Funding' },
  { value: 'MENTORSHIP', label: 'Mentorship' },
  { value: 'INFRASTRUCTURE', label: 'Hardware/Equipment' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'TESTING', label: 'Testing Support' },
  { value: 'PILOT', label: 'Pilot Support' },
]

function ProjectDetailsModal({ team, onClose, onSuccess }) {
  const [form, setForm] = useState({ support_type: 'FUNDING', contribution_details: '' })
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
      // Map frontend selection to backend expectations if needed
      const payload = { ...form }
      if (['SOFTWARE', 'TESTING'].includes(form.support_type)) {
         payload.support_type = 'OTHER' // Fallback for unsupported enums in backend
         payload.contribution_details = `[${form.support_type}] ${form.contribution_details}`
      }
      
      const { data } = await offerSupport(team.id, payload)
      onSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit support offer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
      <div className="modal" style={{ background: 'white', borderRadius: 8, maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: 0 }}>{team.challenge?.title}</h2>
            <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>📍 {team.challenge?.location || team.challenge?.district} · {team.challenge?.category}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-500)' }}>×</button>
        </div>
        
        <div style={{ padding: 24, flex: 1 }}>
          <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Problem Statement</div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--industry-navy)' }}>{team.challenge?.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Priority</div>
                  <StatusBadge value={team.challenge?.priority} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>Current Stage</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{team.stage}</div>
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ background: 'var(--industry-bg)', padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>Team & HEI Information</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>HEI:</strong> {team.university?.name}</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Mentor:</strong> {team.faculty_mentor ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}` : 'TBD'}</div>
                <div style={{ fontSize: 14 }}><strong>Team Size:</strong> {team.students?.length || 0} Students</div>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--gray-200)', margin: '0 0 24px 0' }} />

          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--industry-navy)', marginBottom: 16 }}>Offer Support</h3>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          
          <form onSubmit={handleSubmit} id="support-form">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Support Type <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {SUPPORT_TYPES.map(t => (
                  <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 6, background: form.support_type === t.value ? 'var(--industry-primary-light)' : 'white', borderColor: form.support_type === t.value ? 'var(--industry-primary)' : 'var(--gray-300)' }}>
                    <input type="radio" name="support_type" value={t.value} checked={form.support_type === t.value} onChange={() => setForm(f => ({ ...f, support_type: t.value }))} style={{ margin: 0 }} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Contribution Details <span style={{ color: 'red' }}>*</span></label>
              <textarea 
                className="form-control" 
                rows={4}
                value={form.contribution_details}
                onChange={e => setForm(f => ({ ...f, contribution_details: e.target.value }))}
                placeholder="Describe your offer (e.g. funding amount, mentorship scope, facility details)..." 
                style={{ width: '100%', padding: 12, border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 14 }}
              />
            </div>
          </form>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--gray-50)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" form="support-form" disabled={loading} style={{ padding: '8px 24px', background: 'var(--industry-primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Submitting...' : 'Submit Partnership Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const [filters, setFilters] = useState({ priority: '', support: '', search: '', category: '', district: '', stage: '' })

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
    setFiltersOpen(false)
    loadProjects(filters) // Using standard API params where possible
  }

  const handleSupportSuccess = () => {
    setSelectedTeam(null)
    setSuccessMsg('Partnership offer submitted successfully! The HEI will be notified.')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  // Frontend filtering for fields not directly supported by the generic browseProjects endpoint
  const filteredProjects = projects.filter(p => {
    if (filters.priority && p.challenge?.priority !== filters.priority) return false
    if (filters.search && !p.challenge?.title?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.stage && p.stage !== filters.stage) return false
    if (filters.district && p.challenge?.district && !p.challenge.district.toLowerCase().includes(filters.district.toLowerCase())) return false
    if (filters.category && p.challenge?.category && !p.challenge.category.toLowerCase().includes(filters.category.toLowerCase())) return false
    return true
  })

  return (
    <IndustryLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0' }}>BROWSE PROJECTS</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0 }}>Discover projects that need industry collaboration.</p>
        </div>
        <button 
          onClick={() => setFiltersOpen(!filtersOpen)} 
          style={{ padding: '8px 16px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <span>⚙️</span> Filters
        </button>
      </div>

      {successMsg && <div className="alert alert-success" style={{ marginBottom: 24 }}>{successMsg}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

      {/* Filter Panel */}
      {filtersOpen && (
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid var(--gray-200)', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>FILTER PROJECTS</h3>
          <form onSubmit={handleFilterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Search</label>
                <input type="text" className="form-control" placeholder="Project title..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Priority</label>
                <select className="form-control" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 4 }}>
                  <option value="">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Category</label>
                <input type="text" className="form-control" placeholder="E.g. Health" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>District</label>
                <input type="text" className="form-control" placeholder="Location..." value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 4 }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setFilters({ priority: '', support: '', search: '', category: '', district: '', stage: '' })} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontWeight: 500 }}>Clear</button>
              <button type="submit" style={{ padding: '8px 24px', background: 'var(--industry-navy)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Apply Filters</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <LoadingPage />
      ) : filteredProjects.length === 0 ? (
        <EmptyState icon="🔍" title="No projects found" subtitle="Try adjusting your filters to see more results." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredProjects.map(team => (
            <div key={team.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <StatusBadge value={team.challenge?.priority} />
                  <span style={{ fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{team.stage}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{team.challenge?.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{team.challenge?.category} • {team.challenge?.district}</div>
              </div>
              
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
                  <strong>HEI:</strong> {team.university?.name}
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {team.challenge?.description || team.project_description}
                </p>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setSelectedTeam(team)} style={{ flex: 1, padding: '8px 0', background: 'var(--industry-primary)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                    View / Offer Support
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTeam && (
        <ProjectDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onSuccess={handleSupportSuccess}
        />
      )}
    </IndustryLayout>
  )
}
