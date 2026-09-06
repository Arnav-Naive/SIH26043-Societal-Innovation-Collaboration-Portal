import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import { getFacultyTeams } from '../../api/universities'
import { getTeamMilestones, reviewMilestone } from '../../api/projects'

export default function FacultyMyTeams() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTeams = () => {
    getFacultyTeams()
      .then(({ data }) => setTeams(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError('Unable to load your teams.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTeams() }, [])

  if (loading) return (
    <div><TopHeader title="My Teams" /><div className="page-content"><LoadingPage /></div></div>
  )

  return (
    <div>
      <TopHeader title="My Teams" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">My Teams</h1>
          <p className="page-subtitle">Teams you are mentoring.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && teams.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="No teams assigned"
            subtitle="You have not been assigned as a faculty mentor yet."
          />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {teams.map((team) => (
              <div key={team.id} className="card">
                <div className="card-header">
                  <div className="card-title">{team.challenge?.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <StatusBadge value={team.challenge?.priority} />
                    <StatusBadge value={team.challenge?.status} />
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid-2">
                    <div>
                      <div className="detail-section-title">Challenge</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        📍 {team.challenge?.district} · {team.challenge?.category}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        University: {team.university?.name}
                      </div>
                    </div>
                    <div>
                      <div className="detail-section-title">Team</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        {team.students?.length || 0} student(s) · Stage: {team.stage}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        Milestones: {team.approved_milestones}/{team.milestone_count} approved
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/faculty/teams/${team.id}`)}
                    >
                      Review Team
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
