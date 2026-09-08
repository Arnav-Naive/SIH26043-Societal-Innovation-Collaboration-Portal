import { useState, useEffect } from 'react'
import { getAIConfig, updateAIConfig } from '../../api/master'
import TopHeader from '../../components/common/TopHeader'
import LoadingPage from '../../components/common/LoadingPage'

export default function AIConfigPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await getAIConfig()
      setConfig(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load AI configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Validation
    const totalWeight = parseFloat(config.weight_severity) + 
                        parseFloat(config.weight_frequency) + 
                        parseFloat(config.weight_validation) + 
                        parseFloat(config.weight_population) + 
                        parseFloat(config.weight_urgency)
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setError(`Priority weights must sum to exactly 1.0 (Current sum: ${totalWeight.toFixed(2)})`)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateAIConfig(config)
      setSuccess('AI configuration updated successfully.')
    } catch (err) {
      setError('Failed to update AI configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value })
  }

  if (loading) return <LoadingPage />

  return (
    <div>
      <TopHeader title="AI Configuration" />
      
      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {config && (
          <form onSubmit={handleSave} className="card p-6" style={{ maxWidth: '800px' }}>
            <h3 className="mb-4 text-lg font-bold">General Thresholds</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <label>Category Confidence Threshold (0.0 to 1.0)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.category_confidence_threshold}
                  onChange={(e) => handleChange('category_confidence_threshold', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duplicate Similarity Threshold (0.0 to 1.0)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.duplicate_similarity_threshold}
                  onChange={(e) => handleChange('duplicate_similarity_threshold', e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 className="mb-4 text-lg font-bold mt-6">Priority Factor Weights (Must sum to 1.0)</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <label>Severity Weight</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.weight_severity}
                  onChange={(e) => handleChange('weight_severity', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Frequency Weight</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.weight_frequency}
                  onChange={(e) => handleChange('weight_frequency', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Validation Evidence Weight</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.weight_validation}
                  onChange={(e) => handleChange('weight_validation', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Affected Population Weight</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.weight_population}
                  onChange={(e) => handleChange('weight_population', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Urgency Weight</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" max="1"
                  className="form-control"
                  value={config.weight_urgency}
                  onChange={(e) => handleChange('weight_urgency', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
