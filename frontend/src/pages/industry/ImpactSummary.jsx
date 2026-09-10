import { useEffect, useState } from 'react'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import { getImpactSummary } from '../../api/industry'

export default function ImpactSummary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getImpactSummary().then(res => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingPage />

  return (
    <div>
      <TopHeader title="Impact Summary" />
      <div className="page-content">
        <h1>{data.company_name} - Impact</h1>
        <p>Total Partnerships: {data.total_partnerships}</p>
        <p>Total Funding Committed: {data.total_funding_committed}</p>
        <p>Total Funding Disbursed: {data.total_funding_disbursed}</p>
        <p>Mentors Assigned: {data.mentors_assigned}</p>
      </div>
    </div>
  )
}
