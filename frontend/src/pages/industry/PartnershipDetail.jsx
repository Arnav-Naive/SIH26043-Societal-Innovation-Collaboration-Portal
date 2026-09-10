import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import { getMyPartnerships, getProjectDocuments, uploadProjectDocument, getTeamMentors, assignMentor, addMentorReview } from '../../api/industry'

export default function PartnershipDetail() {
  const { id } = useParams()
  const [partnership, setPartnership] = useState(null)
  const [documents, setDocuments] = useState([])
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyPartnerships().then(({ data }) => {
      const ps = Array.isArray(data) ? data : data.results || []
      const p = ps.find(x => x.id === parseInt(id))
      if (p) {
        setPartnership(p)
        getProjectDocuments(p.project_team).then(res => setDocuments(res.data))
        getTeamMentors(p.project_team).then(res => setMentors(res.data))
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingPage />
  if (!partnership) return <div>Partnership not found</div>

  return (
    <div>
      <TopHeader title="Partnership Detail" />
      <div className="page-content">
        <h1>{partnership.challenge_title}</h1>
        <p>Support Type: {partnership.support_type}</p>
        <p>Details: {partnership.contribution_details}</p>
        
        <h3>Documents</h3>
        <ul>
          {documents.map(d => <li key={d.id}>{d.file}</li>)}
        </ul>

        <h3>Mentors</h3>
        <ul>
          {mentors.map(m => <li key={m.id}>{m.mentor_name}</li>)}
        </ul>
      </div>
    </div>
  )
}
