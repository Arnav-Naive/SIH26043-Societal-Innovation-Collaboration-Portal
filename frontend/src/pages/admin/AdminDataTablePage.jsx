import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import axiosClient from '../../api/axiosClient'

// -------------------
// Config per entity
// -------------------
const ENTITY_CONFIG = {
  users: {
    title: 'User Management',
    endpoint: '/analytics/users/',
    detailEndpoint: (id) => `/analytics/users/${id}/`,
    columns: ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined'],
    labels: { id: 'ID', username: 'Username', email: 'Email', first_name: 'First Name', last_name: 'Last Name', role: 'Role', is_active: 'Active', date_joined: 'Joined' },
    canCreate: true,
    canEdit: true,
    canToggle: true,
    editFields: [
      { name: 'first_name', label: 'First Name', type: 'text' },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'organization', label: 'Organization', type: 'text' },
      { name: 'role', label: 'Role', type: 'select', options: [
        { value: 'citizen', label: 'Citizen' },
        { value: 'hei_spoc', label: 'HEI SPOC' },
        { value: 'faculty_mentor', label: 'Faculty Mentor' },
        { value: 'industry_partner', label: 'Industry Partner' },
        { value: 'gov_admin', label: 'Government Admin' },
      ]},
    ],
    createFields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'first_name', label: 'First Name', type: 'text' },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'role', label: 'Role', type: 'select', required: true, options: [
        { value: 'citizen', label: 'Citizen' },
        { value: 'hei_spoc', label: 'HEI SPOC' },
        { value: 'faculty_mentor', label: 'Faculty Mentor' },
        { value: 'industry_partner', label: 'Industry Partner' },
        { value: 'gov_admin', label: 'Government Admin' },
      ]},
    ],
  },
  universities: {
    title: 'University / HEI Management',
    endpoint: '/analytics/universities/',
    detailEndpoint: (id) => `/analytics/universities/${id}/`,
    columns: ['id', 'name', 'state', 'contact_email', 'district_name', 'spoc_username', 'is_active'],
    labels: { id: 'ID', name: 'Name', state: 'State', contact_email: 'Contact Email', district_name: 'District', spoc_username: 'SPOC', is_active: 'Active' },
    canCreate: true,
    canEdit: true,
    canToggle: true,
    editFields: [
      { name: 'name', label: 'University Name', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
    ],
    createFields: [
      { name: 'name', label: 'University Name', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
    ],
  },
  industry: {
    title: 'Industry Partner Management',
    endpoint: '/analytics/industry/',
    detailEndpoint: (id) => `/analytics/industry/${id}/`,
    columns: ['id', 'company_name', 'sector', 'contact_email', 'username', 'is_active'],
    labels: { id: 'ID', company_name: 'Company', sector: 'Sector', contact_email: 'Email', username: 'User Account', is_active: 'Active' },
    canCreate: false,
    canEdit: true,
    canToggle: true,
    editFields: [
      { name: 'company_name', label: 'Company Name', type: 'text' },
      { name: 'sector', label: 'Sector', type: 'text' },
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
    ],
  },
  'master-data': {
    title: 'Master Data Control',
    endpoint: '/master/categories/',
    detailEndpoint: (id) => `/master/categories/${id}/`,
    columns: ['id', 'name', 'description', 'is_active'],
    labels: { id: 'ID', name: 'Category Name', description: 'Description', is_active: 'Active' },
    canCreate: true,
    canEdit: true,
    canToggle: true,
    editFields: [
      { name: 'name', label: 'Category Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    createFields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  'audit-logs': {
    title: 'Audit Logs',
    endpoint: '/master/audit-logs/',
    columns: ['id', 'username', 'action', 'entity_type', 'entity_id', 'timestamp'],
    labels: { id: 'ID', username: 'User', action: 'Action', entity_type: 'Entity', entity_id: 'Entity ID', timestamp: 'Time' },
    canCreate: false,
    canEdit: false,
    canToggle: false,
  },
}

// ----------------
// Modal Component
// ----------------
function FormModal({ title, fields, initialData, onSave, onClose, saving }) {
  const [form, setForm] = useState(initialData || {})
  const handleChange = (name, val) => setForm(f => ({ ...f, [name]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '500px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div key={field.name} className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
              </label>
              {field.type === 'select' ? (
                <select className="form-control" value={form[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required}>
                  <option value="">Select...</option>
                  {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea className="form-control" rows={3} value={form[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required} />
              ) : (
                <input type={field.type} className="form-control" value={form[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ----------------
// Main Page
// ----------------
export default function AdminDataTablePage() {
  const { entity } = useParams()
  const config = ENTITY_CONFIG[entity]
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const fetchData = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError('')
    try {
      const res = await axiosClient.get(config.endpoint)
      setData(res.data.results || res.data)
    } catch {
      setError('Failed to load data. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggle = async (item) => {
    try {
      const res = await axiosClient.delete(config.detailEndpoint(item.id))
      setData(prev => prev.map(d => d.id === item.id ? { ...d, is_active: res.data.is_active } : d))
      setActionMsg(`Successfully ${res.data.is_active ? 'activated' : 'deactivated'}.`)
      setTimeout(() => setActionMsg(''), 3000)
    } catch {
      setError('Failed to toggle status.')
    }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      await axiosClient.put(config.detailEndpoint(editItem.id), form)
      setEditItem(null)
      setActionMsg('Record updated successfully.')
      setTimeout(() => setActionMsg(''), 3000)
      fetchData()
    } catch {
      setError('Failed to update record.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await axiosClient.post(config.endpoint, form)
      setCreateOpen(false)
      setActionMsg('Record created successfully.')
      setTimeout(() => setActionMsg(''), 3000)
      fetchData()
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create record.')
    } finally {
      setSaving(false)
    }
  }

  const handleMasterToggle = async (item) => {
    try {
      await axiosClient.post(`/master/categories/${item.id}/toggle_active/`)
      fetchData()
    } catch {
      setError('Failed to toggle status.')
    }
  }

  if (!config) return <div style={{ padding: '32px' }}>Unknown entity: {entity}</div>

  const columns = config.columns
  const filtered = data.filter(item =>
    columns.some(col => String(item[col] || '').toLowerCase().includes(search.toLowerCase()))
  )

  const formatCell = (key, val, item) => {
    if (key === 'is_active') return <StatusBadge value={val ? 'ACTIVE' : 'INACTIVE'} />
    if (key === 'timestamp' || key === 'date_joined' || key === 'created_at') {
      return val ? new Date(val).toLocaleString() : '—'
    }
    return String(val ?? '—')
  }

  return (
    <div>
      <TopHeader title={config.title} />
      <div className="page-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1 className="page-title">{config.title}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
            {config.canCreate && (
              <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Add New</button>
            )}
          </div>
        </div>

        {actionMsg && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{actionMsg}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error} <button className="btn btn-sm btn-ghost" onClick={fetchData}>Retry</button></div>}

        <div className="card">
          {loading ? (
            <div className="card-body"><LoadingPage /></div>
          ) : filtered.length === 0 ? (
            <div className="card-body"><EmptyState icon="📂" title={search ? 'No results match your search' : 'No data found'} /></div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    {columns.map(col => <th key={col}>{config.labels?.[col] || col.replace(/_/g, ' ').toUpperCase()}</th>)}
                    {(config.canEdit || config.canToggle) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      {columns.map(col => (
                        <td key={col} style={{ maxWidth: col === 'description' || col === 'action' || col === 'message' ? '200px' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatCell(col, item[col], item)}
                        </td>
                      ))}
                      {(config.canEdit || config.canToggle) && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {config.canEdit && config.editFields && (
                              <button className="btn btn-sm btn-secondary" onClick={() => setEditItem(item)}>Edit</button>
                            )}
                            {config.canToggle && (
                              <button
                                className={`btn btn-sm ${item.is_active ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={() => entity === 'master-data' ? handleMasterToggle(item) : handleToggle(item)}
                              >
                                {item.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editItem && config.editFields && (
        <FormModal
          title={`Edit ${config.title.replace(' Management', '').replace(' Control', '')}`}
          fields={config.editFields}
          initialData={editItem}
          onSave={handleEdit}
          onClose={() => setEditItem(null)}
          saving={saving}
        />
      )}

      {createOpen && config.createFields && (
        <FormModal
          title={`Add New ${config.title.replace(' Management', '').replace(' Control', '')}`}
          fields={config.createFields}
          initialData={{}}
          onSave={handleCreate}
          onClose={() => setCreateOpen(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
