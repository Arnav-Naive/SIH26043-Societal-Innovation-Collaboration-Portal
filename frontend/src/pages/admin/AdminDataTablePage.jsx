import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import axiosClient from '../../api/axiosClient'

export default function AdminDataTablePage() {
  const { entity } = useParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getTitle = () => {
    switch (entity) {
      case 'users': return 'User Management'
      case 'universities': return 'University Management'
      case 'industry': return 'Industry Partners'
      case 'master-data': return 'Master Data Control'
      case 'audit-logs': return 'Audit Logs'
      default: return 'Data Management'
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        let endpoint = ''
        if (entity === 'users') endpoint = '/analytics/users/'
        else if (entity === 'universities') endpoint = '/analytics/universities/'
        else if (entity === 'industry') endpoint = '/analytics/industry/'
        else if (entity === 'master-data') endpoint = '/master/categories/' // Simplified
        else if (entity === 'audit-logs') endpoint = '/master/audit-logs/'

        if (endpoint) {
          const res = await axiosClient.get(endpoint)
          setData(res.data.results || res.data)
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [entity])

  const renderHeaders = () => {
    if (data.length === 0) return null
    return Object.keys(data[0]).map(key => <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>)
  }

  const renderRows = () => {
    return data.map((item, idx) => (
      <tr key={idx}>
        {Object.entries(item).map(([k, v]) => (
          <td key={k}>
            {typeof v === 'boolean' ? <StatusBadge value={v ? 'ACTIVE' : 'INACTIVE'} /> : String(v || '—')}
          </td>
        ))}
      </tr>
    ))
  }

  return (
    <div>
      <TopHeader title={getTitle()} />
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">{getTitle()}</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          {loading ? (
            <div className="card-body"><LoadingPage /></div>
          ) : data.length === 0 ? (
            <div className="card-body">
              <EmptyState icon="📂" title="No data found" />
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>{renderHeaders()}</tr>
                </thead>
                <tbody>
                  {renderRows()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
