import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import CategoryChart from '../../components/charts/CategoryChart'
import DistrictTable from '../../components/charts/DistrictTable'
import PipelineChart from '../../components/charts/PipelineChart'
import Sidebar from '../../components/common/Sidebar'
import { getAllChallenges } from '../../api/challenges'
import { getSummary, getCategoryDistribution, getDistrictDistribution, getPipelineAnalytics } from '../../api/analytics'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [districts, setDistricts] = useState([])
  const [pipelineData, setPipelineData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ q: '', category: '', district: '', status: '', priority: '' })
  const [pendingFilters, setPendingFilters] = useState({ q: '', category: '', district: '', status: '', priority: '' })

  const loadData = useCallback(async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const [chRes, sumRes, catRes, distRes, pipeRes] = await Promise.all([
        getAllChallenges(params),
        getSummary(),
        getCategoryDistribution(),
        getDistrictDistribution(),
        getPipelineAnalytics()
      ])
      setChallenges(Array.isArray(chRes.data) ? chRes.data : chRes.data.results || [])
      setSummary(sumRes.data)
      setCategories(catRes.data)
      setDistricts(distRes.data)
      setPipelineData(pipeRes.data)
    } catch {
      setError('Unable to load dashboard data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleFilterChange = (e) => {
    setPendingFilters({ ...pendingFilters, [e.target.name]: e.target.value })
  }

  const applyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    loadData(pendingFilters)
  }

  const clearFilters = () => {
    const empty = { q: '', category: '', district: '', status: '', priority: '' }
    setPendingFilters(empty)
    setFilters(empty)
    loadData({})
  }

  return (
    <div>
      <TopHeader title="Societal Innovation Dashboard" />
      <div className="page-content">
        <div 
          className="page-header"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(15, 81, 50, 0.95), rgba(20, 45, 29, 0.7)), url('/images/jharkhand_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            padding: '48px 40px',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            marginBottom: '32px'
          }}
        >
          <h1 className="page-title" style={{ color: '#ffffff', fontSize: '2rem', letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.4)', marginBottom: '8px' }}>
            Societal Innovation Dashboard
          </h1>
          <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginTop: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            Monitor problems, institutional collaboration and project progress.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Summary Cards */}
        {summary && (
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-label">Total Challenges</div>
              <div className="summary-card-value">{summary.total_challenges}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Submitted</div>
              <div className="summary-card-value">{summary.submitted}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Under Review</div>
              <div className="summary-card-value">{summary.under_review}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">In Progress</div>
              <div className="summary-card-value">{summary.in_progress}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Completed</div>
              <div className="summary-card-value">{summary.completed}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Teams Formed</div>
              <div className="summary-card-value">{summary.teams_formed}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Active Partnerships</div>
              <div className="summary-card-value">{summary.active_partnerships}</div>
            </div>
          </div>
        )}

        {/* Pipeline Analytics */}
        {pipelineData && pipelineData.length > 0 && (
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-header">
              <span className="card-title">Ecosystem Pipeline</span>
            </div>
            <div className="card-body">
              <PipelineChart data={pipelineData} />
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        <div className="grid-2" style={{ marginBottom: 32 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Challenges by Category</span>
            </div>
            <div className="card-body">
              <CategoryChart data={categories} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">District-wise Breakdown</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <DistrictTable data={districts} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={applyFilters}>
          <div className="filters-bar">
            <div className="form-group filter-search">
              <label className="form-label">Search</label>
              <input
                name="q"
                type="search"
                className="form-control"
                placeholder="Title, ID or district..."
                value={pendingFilters.q}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-control" value={pendingFilters.category} onChange={handleFilterChange}>
                <option value="">All</option>
                {['Water','Agriculture','Education','Health','Infrastructure','Environment','Governance'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={pendingFilters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ROUTED">Routed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" className="form-control" value={pendingFilters.priority} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Apply</button>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        </form>

        {/* Challenge Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Challenge Management</span>
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              {challenges.length} challenge{challenges.length !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <div className="card-body"><LoadingPage /></div>
          ) : challenges.length === 0 ? (
            <div className="card-body">
              <EmptyState icon="🔍" title="No challenges found" subtitle="Try adjusting your filters." />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Problem</th>
                    <th>Category</th>
                    <th>District</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned HEI</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((ch) => (
                    <tr key={ch.id}>
                      <td>
                        <code style={{ fontSize: 11, color: 'var(--color-primary)' }}>
                          {ch.reference_id}
                        </code>
                      </td>
                      <td className="table-cell-title">
                        <div className="table-cell-truncate" title={ch.title}>{ch.title}</div>
                      </td>
                      <td>{ch.category || '—'}</td>
                      <td>{ch.district}</td>
                      <td><StatusBadge value={ch.priority} /></td>
                      <td><StatusBadge value={ch.status} /></td>
                      <td style={{ fontSize: 12 }}>{ch.assigned_university_name || '—'}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(ch.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/admin/challenges/${ch.id}`)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
