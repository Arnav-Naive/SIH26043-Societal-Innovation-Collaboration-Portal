import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IndustryLayout from '../../components/industry/IndustryLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getMyPartnerships } from '../../api/industry'

function LifecycleTimeline({ currentStage }) {
  // Ordered stages mapping from the challenge to team to deployment lifecycle
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

  // A very basic stage index resolver. In reality, this would be computed from the project state.
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

export default function MyPartnerships() {
  const navigate = useNavigate()
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyPartnerships()
      .then(({ data }) => setPartnerships(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <IndustryLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0' }}>MY PARTNERSHIPS</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0 }}>Track your active collaborations from challenge to deployment.</p>
      </div>

      {loading ? (
        <LoadingPage />
      ) : partnerships.length === 0 ? (
        <EmptyState 
          icon="🤝" 
          title="No Active Partnerships" 
          subtitle="You haven't partnered with any projects yet."
          action={{ label: 'Browse Projects', onClick: () => navigate('/industry/browse-projects') }}
        />
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {partnerships.map(p => (
            <div key={p.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }} onClick={() => navigate(`/industry/partnerships/${p.id}`)} onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--industry-navy)', margin: '0 0 8px 0' }}>{p.project_team?.challenge?.title || 'Unknown Project'}</h3>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', gap: 16 }}>
                    <span><strong>HEI:</strong> {p.project_team?.university?.name}</span>
                    <span><strong>Support:</strong> {p.support_type}</span>
                  </div>
                </div>
                <StatusBadge value={p.status} />
              </div>

              <div style={{ margin: '24px 0' }}>
                <LifecycleTimeline currentStage={p.project_team?.stage || 'TEAM_FORMED'} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--industry-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </IndustryLayout>
  )
}
