import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import StatusTimeline from '../../components/common/StatusTimeline'
import LoadingPage from '../../components/common/LoadingPage'
import { getChallengeDetail, submitCitizenFeedback } from '../../api/challenges'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function InfoRow({ icon, label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: 18, minWidth: 24 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, color: accent || 'var(--gray-800)', fontWeight: 500, lineHeight: 1.5 }}>{value}</div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, children, accentColor, borderTop }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--border-color)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      borderTop: borderTop ? `4px solid ${borderTop}` : undefined,
    }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>{title}</span>
      </div>
      <div style={{ padding: '8px 24px 20px' }}>
        {children}
      </div>
    </div>
  )
}

export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState('')

  const loadData = () => {
    setLoading(true)
    getChallengeDetail(id)
      .then(({ data }) => setChallenge(data))
      .catch(() => setError('Unable to load challenge details.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  useEffect(() => {
    let interval;
    if (challenge?.classification_source === 'pending') {
      interval = setInterval(() => {
        getChallengeDetail(id).then(({ data }) => setChallenge(data))
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [id, challenge?.classification_source])

  const handleFeedback = async (action, comments) => {
    setFeedbackSubmitting(true)
    setFeedbackError('')
    try {
      await submitCitizenFeedback(id, action, comments)
      setFeedbackSuccess('Thank you for your feedback.')
      loadData()
    } catch {
      setFeedbackError('Could not submit feedback.')
      setFeedbackSubmitting(false)
    }
  }

  if (loading) return (
    <div>
      <TopHeader title="Problem Details" />
      <div className="page-content"><LoadingPage /></div>
    </div>
  )

  if (error || !challenge) return (
    <div>
      <TopHeader title="Problem Details" />
      <div className="page-content" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="alert alert-error">{error || 'Challenge not found.'}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  )

  const team = challenge.project_team

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <TopHeader title="Problem Details" />
      <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Back + Title Banner */}
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 20, color: 'var(--color-primary)', fontWeight: 600 }}
          >
            ← Back to My Problems
          </button>

          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
            borderRadius: 16,
            padding: '32px 36px',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {challenge.reference_id}
                </span>
                <StatusBadge value={challenge.status} />
                <StatusBadge value={challenge.priority} />
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 800, lineHeight: 1.3, color: '#fff' }}>
                {challenge.title}
              </h1>
              <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {challenge.district && <span>📍 {challenge.district}{challenge.location ? `, ${challenge.location}` : ''}</span>}
                <span>📅 Submitted {formatDate(challenge.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Twin Notice */}
        {challenge.problem_twin_context && (
          <div style={{ padding: '16px 20px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: 14, marginBottom: 4 }}>Related Problem Detected</div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                Your submission has been grouped with similar reports (Reference: {challenge.problem_twin_context.twin_ref}) to ensure a faster, coordinated resolution.
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Platform Progress */}
            <SectionCard title="Platform Progress" icon="🚀" borderTop="var(--color-primary)">
              <div style={{ paddingTop: 20 }}>
                <StatusTimeline status={challenge.status} />
              </div>
            </SectionCard>

            {/* Problem Description */}
            <SectionCard title="Problem Details" icon="📋">
              <InfoRow
                icon="📝"
                label="Description"
                value={<span style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</span>}
              />
              <InfoRow icon="📍" label="District" value={challenge.district} />
              {challenge.location && <InfoRow icon="🏘️" label="Location" value={challenge.location} />}
              <InfoRow
                icon="🗂️"
                label="Category"
                value={
                  <span>
                    {challenge.category}
                    {challenge.category_confidence > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 12 }}>
                        {challenge.category_confidence}% confidence
                      </span>
                    )}
                  </span>
                }
              />
              <div style={{ padding: '14px 0', display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Priority</div>
                  <StatusBadge value={challenge.priority} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</div>
                  <StatusBadge value={challenge.status} />
                </div>
              </div>
            </SectionCard>

            {/* Evidence */}
            {challenge.media && challenge.media.length > 0 && (
              <SectionCard title="Submitted Evidence" icon="🖼️">
                <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {challenge.media.map((m) => (
                    m.media_type === 'image' ? (
                      <img
                        key={m.id}
                        src={m.file_url || m.file}
                        alt="Evidence photo"
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onClick={() => window.open(m.file_url || m.file, '_blank')}
                      />
                    ) : (
                      <a
                        key={m.id}
                        href={m.file_url || m.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', borderRadius: 10, border: '1px solid var(--border-color)', aspectRatio: '1/1', fontSize: 32, textDecoration: 'none' }}
                      >
                        📄
                      </a>
                    )
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Feedback for Completed */}
            {challenge.status === 'COMPLETED' && (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                border: '2px solid var(--color-success)',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <div style={{ padding: '18px 24px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>Verification & Feedback</span>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  {feedbackSuccess ? (
                    <div className="alert alert-success">{feedbackSuccess}</div>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20, lineHeight: 1.6 }}>
                        This problem has been marked as <strong>completed</strong> by the assigned team. Please confirm if the issue has been resolved in your area.
                      </p>
                      {feedbackError && <div className="alert alert-error">{feedbackError}</div>}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          disabled={feedbackSubmitting}
                          onClick={() => {
                            const comments = prompt('Any comments for the team? (Optional)')
                            handleFeedback('resolved', comments || '')
                          }}
                          style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                        >
                          ✅ Yes, Issue is Resolved
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={feedbackSubmitting}
                          onClick={() => {
                            const comments = prompt('Please explain what is still pending:')
                            if (comments) handleFeedback('not_resolved', comments)
                          }}
                        >
                          ⚠️ No, Still Exists
                        </button>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 14 }}>
                        If the issue still exists, this problem will be reopened and routed back for further action.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* AI Assessment */}
            {challenge.ai_category_name && (
              <SectionCard title="AI Assessment" icon="🧠" borderTop="#8b5cf6">
                <div style={{ paddingTop: 4 }}>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Category</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{challenge.ai_category_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2 }}>{Math.round(challenge.ai_confidence * 100)}% confidence</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Priority</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{challenge.priority}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{challenge.priority_score?.toFixed(1)} / 10.0</div>
                    </div>
                  </div>

                  {challenge.ai_classification_reason && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AI Reasoning</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)', background: '#f5f3ff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e9d5ff', lineHeight: 1.6 }}>
                        {challenge.ai_classification_reason}
                      </div>
                    </div>
                  )}

                  {challenge.priority_reason && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Priority Factors</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)', background: '#f5f3ff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e9d5ff', lineHeight: 1.6 }}>
                        {challenge.priority_reason}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Innovation Journey */}
            <SectionCard title="Innovation Journey" icon="🎓" borderTop="var(--color-primary)">
              <div style={{ paddingTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <InfoRow
                    icon="🏫"
                    label="Assigned University"
                    value={challenge.assigned_university_name || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned yet</span>}
                    accent={challenge.assigned_university_name ? 'var(--color-primary-dark)' : undefined}
                  />
                  <InfoRow
                    icon="👥"
                    label="Project Team"
                    value={team ? `${team.students?.length || 0} student(s) enrolled` : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not formed yet</span>}
                  />
                  <InfoRow
                    icon="👨‍🏫"
                    label="Faculty Mentor"
                    value={team?.faculty_mentor
                      ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                      : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned yet</span>
                    }
                  />
                  {team && (
                    <InfoRow icon="📌" label="Project Stage" value={team.stage} />
                  )}
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  )
}
