// Challenge status timeline — horizontal (desktop) + vertical (mobile)

const STAGES = [
  { key: 'SUBMITTED',    label: 'Submitted',     icon: '📝', desc: 'Problem received' },
  { key: 'UNDER_REVIEW', label: 'Under Review',  icon: '🔍', desc: 'Being verified' },
  { key: 'ROUTED',       label: 'Routed',        icon: '🏫', desc: 'Sent to university' },
  { key: 'IN_PROGRESS',  label: 'In Progress',   icon: '⚙️', desc: 'Team working on it' },
  { key: 'COMPLETED',    label: 'Resolved',      icon: '✅', desc: 'Problem solved' },
]

const STAGE_ORDER = STAGES.map(s => s.key)

function getStageClass(stageKey, currentStatus) {
  const stageIdx   = STAGE_ORDER.indexOf(stageKey)
  const currentIdx = STAGE_ORDER.indexOf(currentStatus)
  if (stageIdx < currentIdx)  return 'completed'
  if (stageIdx === currentIdx) return 'active'
  return 'pending'
}

export default function StatusTimeline({ status }) {
  const currentIdx = STAGE_ORDER.indexOf(status)

  return (
    <>
      {/* Desktop Horizontal Timeline */}
      <div className="desktop-only" style={{ position: 'relative', padding: '8px 0 24px' }}>
        {/* Progress bar track */}
        <div style={{
          position: 'absolute',
          top: 26,
          left: `calc(100% / ${STAGES.length} / 2)`,
          right: `calc(100% / ${STAGES.length} / 2)`,
          height: 4,
          background: 'var(--gray-200)',
          borderRadius: 4,
        }} />
        {/* Filled progress */}
        <div style={{
          position: 'absolute',
          top: 26,
          left: `calc(100% / ${STAGES.length} / 2)`,
          width: currentIdx === 0 ? '0%' : `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - 0px)`,
          height: 4,
          background: 'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))',
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {STAGES.map((s, idx) => {
            const cls = getStageClass(s.key, status)
            const isCompleted = cls === 'completed'
            const isActive = cls === 'active'

            return (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isCompleted ? 'var(--color-primary)' : isActive ? '#fff' : '#fff',
                  border: isCompleted ? '3px solid var(--color-primary)' : isActive ? '3px solid var(--color-primary)' : '3px solid var(--gray-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isCompleted ? 18 : 20,
                  boxShadow: isActive ? '0 0 0 6px rgba(37,99,235,0.12)' : isCompleted ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.3s ease',
                  color: isCompleted ? '#fff' : isActive ? 'var(--color-primary)' : 'var(--gray-300)',
                  fontWeight: 700,
                }}>
                  {isCompleted ? '✓' : s.icon}
                </div>
                <div style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : isCompleted ? 600 : 500,
                  color: isActive ? 'var(--color-primary-dark)' : isCompleted ? 'var(--gray-800)' : 'var(--gray-400)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  {s.label}
                </div>
                {isActive && (
                  <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600, marginTop: 3, background: '#eff6ff', padding: '2px 8px', borderRadius: 10 }}>
                    CURRENT
                  </div>
                )}
                {isCompleted && (
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 3 }}>
                    Done
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="mobile-only" style={{ padding: '8px 0' }}>
        {STAGES.map((s, idx) => {
          const cls = getStageClass(s.key, status)
          const isCompleted = cls === 'completed'
          const isActive = cls === 'active'
          const isPending = cls === 'pending'
          const isLast = idx === STAGES.length - 1

          return (
            <div key={s.key} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: isLast ? 0 : 24 }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: 22,
                  top: 44,
                  bottom: 0,
                  width: 3,
                  background: isCompleted ? 'var(--color-primary)' : 'var(--gray-200)',
                  borderRadius: 2,
                }} />
              )}
              {/* Dot */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                minWidth: 44,
                background: isCompleted ? 'var(--color-primary)' : isActive ? '#fff' : '#fff',
                border: isCompleted ? '3px solid var(--color-primary)' : isActive ? '3px solid var(--color-primary)' : '3px solid var(--gray-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isCompleted ? 16 : 18,
                boxShadow: isActive ? '0 0 0 5px rgba(37,99,235,0.12)' : 'none',
                color: isCompleted ? '#fff' : isActive ? 'var(--color-primary)' : 'var(--gray-300)',
                zIndex: 1,
                flexShrink: 0,
              }}>
                {isCompleted ? '✓' : s.icon}
              </div>
              {/* Content */}
              <div style={{ paddingTop: 8 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: isActive ? 800 : isCompleted ? 600 : 500,
                  color: isActive ? 'var(--color-primary-dark)' : isCompleted ? 'var(--gray-900)' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {s.label}
                  {isActive && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-primary)', color: '#fff', padding: '2px 8px', borderRadius: 10 }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                  {isActive ? 'In progress...' : isCompleted ? s.desc : 'Pending'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
