import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = {
  citizen: 'Citizen',
  hei_spoc: 'HEI SPOC',
  faculty_mentor: 'Faculty Mentor',
  industry_partner: 'Industry Partner',
  gov_admin: 'Government Admin',
}

export default function TopHeader({ title }) {
  const { user } = useAuth()

  return (
    <header className="top-header">
      <div className="top-header-title">{title}</div>
      {user && (
        <div className="top-header-right">
          <div className="top-header-user">
            {user.first_name} {user.last_name}
          </div>
          <span className="top-header-role-badge">
            {ROLE_LABEL[user.role] || user.role}
          </span>
        </div>
      )}
    </header>
  )
}
