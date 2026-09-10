import { useEffect, useState } from 'react'
import IndustryLayout from '../../components/industry/IndustryLayout'
import { getMyPartnerships, offerSupport } from '../../api/industry'

function AddContributionModal({ partnerships, onClose, onSuccess }) {
  const [form, setForm] = useState({ team_id: '', support_type: 'FUNDING', amount: '', details: '', date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.team_id || !form.details) {
      setError('Project and details are required.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        support_type: ['FUNDING', 'MENTORSHIP', 'PILOT', 'INFRASTRUCTURE'].includes(form.support_type) ? form.support_type : 'OTHER',
        contribution_details: `[${form.support_type}] Quantity/Amount: ${form.amount}. Date: ${form.date}. Details: ${form.details}`,
        amount: form.support_type === 'FUNDING' ? form.amount : null,
      }
      await offerSupport(form.team_id, payload)
      onSuccess()
    } catch (err) {
      setError('Failed to save contribution. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
      <div className="modal" style={{ background: 'white', borderRadius: 8, maxWidth: 600, width: '100%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--industry-navy)' }}>ADD CONTRIBUTION</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-500)' }}>×</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} id="contrib-form">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Project / Partnership <span style={{color:'red'}}>*</span></label>
            <select className="form-control" value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--gray-300)' }}>
              <option value="">Select a project...</option>
              {partnerships.map(p => (
                <option key={p.id} value={p.project_team?.id}>{p.project_team?.challenge?.title || `Team ${p.project_team?.id}`}</option>
              ))}
            </select>
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Contribution Type <span style={{color:'red'}}>*</span></label>
              <select className="form-control" value={form.support_type} onChange={e => setForm({...form, support_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--gray-300)' }}>
                <option value="FUNDING">Funding</option>
                <option value="MENTORSHIP">Technical Mentorship</option>
                <option value="INFRASTRUCTURE">Equipment</option>
                <option value="SOFTWARE">Software</option>
                <option value="TESTING">Testing Support</option>
                <option value="PILOT">Pilot Support</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Amount / Quantity</label>
              <input type="text" className="form-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="e.g. 50000 or 12 Sensors" style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--gray-300)' }} />
            </div>
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Date <span style={{color:'red'}}>*</span></label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--gray-300)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Supporting Document (Optional)</label>
              <input type="file" className="form-control" style={{ width: '100%', padding: 7, borderRadius: 4, border: '1px solid var(--gray-300)' }} />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Description <span style={{color:'red'}}>*</span></label>
            <textarea className="form-control" rows={3} value={form.details} onChange={e => setForm({...form, details: e.target.value})} placeholder="Briefly describe the contribution..." style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--gray-300)' }} />
          </div>
        </form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" form="contrib-form" disabled={loading} style={{ padding: '8px 24px', background: 'var(--industry-primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Submitting...' : 'Submit Contribution'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyContributions() {
  const [partnerships, setPartnerships] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getMyPartnerships().then(({ data }) => setPartnerships(Array.isArray(data) ? data : data.results || []))
  }, [])

  return (
    <IndustryLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0' }}>MY CONTRIBUTIONS</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0 }}>Track the support your organization provides to innovation projects.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'var(--industry-accent)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>+</span> Add Contribution
        </button>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 24 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {/* Mock Data as requested by user instructions to show specific values */}
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, borderTop: '3px solid var(--industry-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💰</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Funding</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)' }}>₹8,50,000</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>Projects Supported: <strong>3</strong></div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, borderTop: '3px solid var(--industry-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧠</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Technical Mentorship</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)' }}>18 Sessions</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>Projects Supported: <strong>6</strong></div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, borderTop: '3px solid var(--industry-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚙️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Equipment</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)' }}>12 IoT Sensors</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>Projects Supported: <strong>4</strong></div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, borderTop: '3px solid var(--industry-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧪</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Testing Support</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)' }}>4 Projects</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, borderTop: '3px solid var(--industry-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--industry-primary-light)', color: 'var(--industry-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚀</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Pilot Support</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--industry-navy)' }}>2 Communities</div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AddContributionModal 
          partnerships={partnerships} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false)
            setSuccess('Contribution saved successfully! It will appear in your history shortly.')
            setTimeout(() => setSuccess(''), 5000)
          }} 
        />
      )}
    </IndustryLayout>
  )
}
