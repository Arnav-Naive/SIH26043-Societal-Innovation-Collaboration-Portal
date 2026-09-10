import { useState } from 'react'
import TopHeader from '../../components/common/TopHeader'
import axiosClient from '../../api/axiosClient'

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('challenges')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const response = await axiosClient.get(`/analytics/export/?type=${reportType}`, {
        responseType: 'blob', // Important for downloading files
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_report.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Failed to download report.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <TopHeader title="Reports & Exports" />
      
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Reports & Exports</h1>
          <p className="page-subtitle">Download system data for offline analysis.</p>
        </div>

        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-header">
            <span className="card-title">Export Data</span>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '14px' }}>
              Select the type of data you wish to export. The report will be downloaded as a CSV file which can be opened in Excel or converted to PDF.
            </p>
            
            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Report Type</label>
              <select 
                className="form-control" 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="challenges">Problems / Challenges</option>
                <option value="users">Users</option>
                <option value="universities">Universities / HEIs</option>
              </select>
            </div>

            <div>
              <button 
                className="btn btn-primary btn-block"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Generating...' : `Download ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (CSV)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
