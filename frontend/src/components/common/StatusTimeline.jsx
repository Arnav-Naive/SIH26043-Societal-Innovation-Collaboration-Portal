// Challenge status timeline — horizontal (desktop) + vertical (mobile)

const STAGES = [
  { key: 'SUBMITTED',    label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ROUTED',       label: 'Routed' },
  { key: 'IN_PROGRESS',  label: 'In Progress' },
  { key: 'COMPLETED',    label: 'Completed' },
]

const STAGE_ORDER = STAGES.map(s => s.key)

function getStageClass(stageKey, currentStatus) {
  const stageIdx   = STAGE_ORDER.indexOf(stageKey)
  const currentIdx = STAGE_ORDER.indexOf(currentStatus)
  if (stageIdx < currentIdx)  return 'completed'
  if (stageIdx === currentIdx) return 'active'
  return ''
}

export default function StatusTimeline({ status }) {
  return (
    <>
      {/* Desktop Horizontal */}
      <div className="timeline">
        {STAGES.map((s) => {
          const cls = getStageClass(s.key, status)
          return (
            <div key={s.key} className={`timeline-step ${cls}`}>
              <div className="timeline-step-dot">
                {cls === 'completed' ? '✓' : ''}
              </div>
              <div className="timeline-step-label">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Mobile Vertical */}
      <div className="timeline-vertical">
        {STAGES.map((s) => {
          const cls = getStageClass(s.key, status)
          return (
            <div key={s.key} className={`timeline-vertical-step ${cls}`}>
              <div className="timeline-vertical-dot">
                {cls === 'completed' ? '✓' : ''}
              </div>
              <div className="timeline-vertical-content">
                <div className="timeline-vertical-title">{s.label}</div>
                {cls === 'active' && (
                  <div className="timeline-vertical-sub">Current stage</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
