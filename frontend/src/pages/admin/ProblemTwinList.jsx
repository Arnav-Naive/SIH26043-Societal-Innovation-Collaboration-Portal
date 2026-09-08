import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import axiosClient from '../../api/axiosClient'

export default function ProblemTwinList() {
  const [twins, setTwins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTwins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosClient.get('/challenges/twins/')
      setTwins(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch {
      setError('Unable to load Problem Twins. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTwins() }, [loadTwins])

  return (
    <div>
      <TopHeader title="Problem Twins" />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Problem Twins</h1>
          <p className="page-subtitle">
            AI-detected underlying civic problems grouped from multiple citizen reports.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingPage />
        ) : twins.length === 0 ? (
          <EmptyState
            icon="🧬"
            title="No Problem Twins Detected"
            subtitle="The AI has not detected any highly similar problem groups yet."
          />
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Twin ID</th>
                    <th>Problem Title</th>
                    <th>Sector</th>
                    <th>District</th>
                    <th>Reports</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {twins.map(twin => (
                    <tr key={twin.id}>
                      <td>
                        <code style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
                          {twin.reference_id}
                        </code>
                      </td>
                      <td className="table-cell-title">{twin.title}</td>
                      <td>{twin.category_name}</td>
                      <td>{twin.district_name}</td>
                      <td>
                        <span className="badge">{twin.linked_challenges?.length || 0} reports</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          twin.risk_level === 'ESCALATED' ? 'badge-high'
                          : twin.risk_level === 'HIGH' ? 'badge-medium'
                          : 'badge-low'
                        }`}>
                          {twin.risk_level}
                        </span>
                      </td>
                      <td><StatusBadge value={twin.status} /></td>
                      <td>
                        <Link to={`/admin/problem-twins/${twin.id}`} className="btn btn-sm btn-secondary">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
