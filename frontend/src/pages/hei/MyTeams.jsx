import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getMyTeams } from '../../api/universities'

const STAGE_LABELS = {
  FORMED: 'Team Formation',
  PROPOSAL: 'Proposal',
  DEVELOPMENT: 'Development',
  PILOT: 'Pilot',
  IMPLEMENTATION: 'Implementation',
  IMPACT: 'Impact',
}

const ALL_STAGES = ['FORMED', 'PROPOSAL', 'DEVELOPMENT', 'PILOT', 'IMPLEMENTATION', 'IMPACT']

function StageProgress({ currentStage }) {
  const currentIdx = ALL_STAGES.indexOf(currentStage)
  return (
    <div className="stage-progress">
      {ALL_STAGES.map((s, i) => {
        let cls = ''
        if (i < currentIdx) cls = 'done'
        else if (i === currentIdx) cls = 'current'
        return (
          <div key={s} className={`stage-item ${cls}`}>
            <div className="stage-dot" />
            <div className="stage-label">{STAGE_LABELS[s]}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function MyTeams() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyTeams()
      .then(({ data }) => setTeams(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError('Unable to load teams.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div><TopHeader title="My Teams" /><div className="page-content"><LoadingPage /></div></div>
  )

  return (
    <div>
      <TopHeader title="My Teams" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">My Teams</h1>
          <p className="page-subtitle">Project teams formed by your institution.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && teams.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No teams formed yet"
            subtitle="Form a team for an assigned challenge to get started."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/hei/assigned-challenges')}>
                View Assigned Challenges
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {teams.map((team) => (
              <div key={team.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{team.project_title || team.challenge?.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                      📍 {team.challenge?.district} · {team.challenge?.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <StatusBadge value={team.challenge?.priority} />
                    <StatusBadge value={team.challenge?.status} />
                  </div>
                </div>
                <div className="card-body">
                  <StageProgress currentStage={team.stage} />

                  <div className="grid-2" style={{ marginTop: 16 }}>
                    <div>
                      <div className="detail-section-title">Team</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 4 }}>
                        <strong>Faculty:</strong>{' '}
                        {team.faculty_mentor
                          ? `${team.faculty_mentor.first_name} ${team.faculty_mentor.last_name}`
                          : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned</span>
                        }
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        <strong>Students:</strong> {team.students?.length || 0} member(s)
                      </div>
                    </div>
                    <div>
                      <div className="detail-section-title">Progress</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        Milestones: {team.approved_milestones}/{team.milestone_count} approved
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        Partnerships: {team.partnerships_count}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/hei/teams/${team.id}`)}
                    >
                      Open Project Workspace
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
