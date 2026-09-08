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
        <div className="card p-6" style={{ maxWidth: '600px' }}>
          <h2 className="text-xl font-bold mb-4">Export Data</h2>
          <p className="text-gray-600 mb-6">Select the type of data you wish to export. The report will be downloaded as a CSV file which can be opened in Excel or converted to PDF.</p>
          
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
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

          <div className="flex">
            <button 
              className="btn btn-primary w-full"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Generating...' : `Download ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (CSV)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
