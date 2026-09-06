import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import StatusTimeline from '../../components/common/StatusTimeline'
import LoadingPage from '../../components/common/LoadingPage'
import { getChallengeDetail } from '../../api/challenges'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getChallengeDetail(id)
      .then(({ data }) => setChallenge(data))
      .catch(() => setError('Unable to load challenge details.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div>
      <TopHeader title="Challenge Details" />
      <div className="page-content"><LoadingPage /></div>
    </div>
  )

  if (error || !challenge) return (
    <div>
      <TopHeader title="Challenge Details" />
      <div className="page-content">
        <div className="alert alert-error">{error || 'Challenge not found.'}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  )

  const team = challenge.project_team

  return (
    <div>
      <TopHeader title={challenge.reference_id} />
      <div className="page-content">
        <div style={{ marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="page-header">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
              {challenge.reference_id}
            </span>
            <StatusBadge value={challenge.status} />
            <StatusBadge value={challenge.priority} />
          </div>
          <h1 className="page-title">{challenge.title}</h1>
        </div>

        {/* Status Timeline */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Platform Progress</span>
          </div>
          <div className="card-body">
            <StatusTimeline status={challenge.status} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

          {/* Problem Details */}
          <div className="card">
            <div className="card-header"><span className="card-title">Problem</span></div>
            <div className="card-body">
              <div className="detail-section">
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">District</span>
                  <span className="detail-value">{challenge.district}</span>
                </div>
                {challenge.location && (
                  <div className="detail-row">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{challenge.location}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    {challenge.category}
                    {challenge.category_confidence > 0 && (
                      <span style={{ marginLeft: 8, color: 'var(--gray-400)', fontSize: 12 }}>
                        ({challenge.category_confidence}% confidence)
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Priority</span>
                  <span><StatusBadge value={challenge.priority} /></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted</span>
                  <span className="detail-value">{formatDate(challenge.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence */}
          {challenge.media && challenge.media.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Evidence</span></div>
              <div className="card-body">
                <div className="media-grid">
                  {challenge.media.map((m) => (
                    m.media_type === 'image' ? (
                      <img
                        key={m.id}
                        src={m.file_url || m.file}
                        alt="Evidence photo"
                        className="media-thumb"
                      />
                    ) : (
                      <a
                        key={m.id}
                        href={m.file_url || m.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-thumb"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', fontSize: 28 }}
                      >
                        📄
                      </a>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Innovation Journey */}
          <div className="card">
            <div className="card-header"><span className="card-title">Innovation Journey</span></div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">Assigned University</span>
                <span className="detail-value">
                  {challenge.assigned_university_name || (
                    <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned yet</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Project Team</span>
                <span className="detail-value">
                  {team ? `${team.students?.length || 0} student(s)` : (
                    <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not formed yet</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Faculty Mentor</span>
                <span className="detail-value">
                  {team?.faculty_mentor ? (
                    `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                  ) : (
                    <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned yet</span>
                  )}
                </span>
              </div>
              {team && (
                <div className="detail-row">
                  <span className="detail-label">Project Stage</span>
                  <span className="detail-value">{team.stage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
