import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import IndustryLayout from '../../components/industry/IndustryLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import api from '../../api/axiosClient'

function LifecycleTimeline({ currentStage }) {
  const STAGES = [
    { id: 'SUBMITTED', label: 'Challenge' },
    { id: 'ACCEPTED', label: 'HEI Accepted' },
    { id: 'TEAM_FORMED', label: 'Team Formed' },
    { id: 'RESEARCH', label: 'Research' },
    { id: 'PROTOTYPE', label: 'Prototype' },
    { id: 'TESTING', label: 'Testing' },
    { id: 'PILOT', label: 'Pilot' },
    { id: 'IMPACT', label: 'Impact' },
    { id: 'DEPLOYMENT', label: 'Deployment' },
  ]

  const getStageIndex = (stageString) => {
    const s = (stageString || '').toUpperCase()
    if (s.includes('DEPLOY') || s.includes('COMPLETED')) return 8
    if (s.includes('IMPACT')) return 7
    if (s.includes('PILOT')) return 6
    if (s.includes('TEST')) return 5
    if (s.includes('PROTOTYPE') || s.includes('DEV')) return 4
    if (s.includes('RESEARCH') || s.includes('IDEATION')) return 3
    if (s.includes('TEAM')) return 2
    if (s.includes('ACCEPTED') || s.includes('ROUTED')) return 1
    return 0
  }

  const currentIndex = getStageIndex(currentStage)

  return (
    <div className="timeline-horizontal">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex
        const isCurrent = idx === currentIndex
        let statusClass = ''
        if (isCompleted) statusClass = 'completed'
        else if (isCurrent) statusClass = 'current'
        
        return (
          <div key={stage.id} className={`timeline-step ${statusClass}`}>
            <div className="timeline-icon">
              {isCompleted ? '✓' : isCurrent ? '●' : '○'}
            </div>
            <div className="timeline-label">{stage.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function PartnershipDetail() {
  const { id } = useParams()
  const [partnership, setPartnership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Currently no detail endpoint in api/industry.js, so we fetch all and filter, or we can use the generic API
    // To respect backend structure, we fetch my partnerships and find it.
    api.get('/industry/my-partnerships/')
      .then(({ data }) => {
        const results = Array.isArray(data) ? data : data.results || []
        const p = results.find(item => item.id.toString() === id)
        if (p) setPartnership(p)
        else setError('Partnership not found.')
      })
      .catch(() => setError('Unable to load partnership details.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <IndustryLayout><LoadingPage /></IndustryLayout>
  if (error) return <IndustryLayout><div className="alert alert-error">{error}</div></IndustryLayout>
  if (!partnership) return null

  const p = partnership
  const team = p.project_team

  return (
    <IndustryLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/industry/partnerships" style={{ textDecoration: 'none', color: 'var(--gray-500)', fontSize: 24 }}>←</Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 4px 0' }}>{team?.challenge?.title}</h1>
          <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>Partnership ID: PRT-{p.id.toString().padStart(4, '0')}</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Progress Timeline</h3>
        <LifecycleTimeline currentStage={team?.stage || 'TEAM_FORMED'} />
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Project Information</h3>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Category:</strong> {team?.challenge?.category}</div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Location:</strong> {team?.challenge?.district}</div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Priority:</strong> <StatusBadge value={team?.challenge?.priority} /></div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Description:</strong> <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--industry-navy)' }}>{team?.challenge?.description}</p></div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Team Information</h3>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>HEI:</strong> {team?.university?.name}</div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Faculty Mentor:</strong> {team?.faculty_mentor ? `${team?.faculty_mentor.first_name} ${team?.faculty_mentor.last_name}` : 'Not assigned'}</div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: 'var(--gray-600)' }}>Team Size:</strong> {team?.students?.length || 0} Students</div>
          </div>
        </div>

        <div>
          <div style={{ background: 'var(--industry-primary-light)', border: '1px solid var(--industry-primary)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--industry-primary)', margin: 0 }}>Industry Support Provided</h3>
              <StatusBadge value={p.status} />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: 'var(--industry-navy)' }}>Support Type:</strong>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--industry-primary)', marginTop: 4 }}>{p.support_type}</div>
            </div>
            
            {p.amount && (
              <div style={{ marginBottom: 16 }}>
                <strong style={{ color: 'var(--industry-navy)' }}>Funding Amount:</strong>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--industry-primary)', marginTop: 4 }}>₹{p.amount.toLocaleString()}</div>
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: 'var(--industry-navy)' }}>Contribution Details:</strong>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--industry-navy)' }}>{p.contribution_details}</p>
            </div>
            
            {p.response_note && (
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 6, fontSize: 13, borderLeft: '3px solid var(--industry-accent)' }}>
                <strong>Note from HEI:</strong> {p.response_note}
              </div>
            )}
          </div>
        </div>
      </div>
    </IndustryLayout>
  )
}
