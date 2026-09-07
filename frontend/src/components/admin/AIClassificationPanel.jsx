/**
 * AIClassificationPanel — SamadhanX
 * ===================================
 * Renders the AI classification result and priority assessment.
 * The panel has three states driven by ai_classification.review_status:
 *
 *   'pending'    — AI ran, admin has not reviewed yet
 *   'accepted'   — Admin accepted the AI result (persisted in DB)
 *   'overridden' — Admin chose a different category/priority
 *
 * State is read directly from the API response and persists across
 * browser refreshes / re-logins.
 */
import { useState } from 'react'
import { acceptAIResult, overrideAI, reprocessAI } from '../../api/challenges'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ConfidenceBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11, fontWeight: 600 }}>Confidence</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ background: 'var(--gray-100)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function FactorRow({ label, value, max = 5 }) {
  const score = Number(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ flex: '0 0 160px', fontSize: 13, color: 'var(--gray-600)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: i < score ? 'var(--color-primary)' : 'var(--gray-100)' }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{score}/{max}</span>
    </div>
  )
}

function SourceBadge({ source }) {
  const MAP = {
    ai:       { label: 'AI (Gemini)',   color: '#1d4ed8', bg: '#eff6ff' },
    keyword:  { label: 'Keyword Rules', color: '#374151', bg: '#f3f4f6' },
    fallback: { label: 'Fallback',      color: '#92400e', bg: '#fffbeb' },
  }
  const cfg = MAP[source] || MAP.keyword
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  )
}

function ReviewStatusBadge({ status }) {
  const MAP = {
    accepted:   { label: '✓ Accepted',  color: '#16a34a', bg: '#f0fdf4', border: '#16a34a30' },
    overridden: { label: '✎ Overridden', color: '#b45309', bg: '#fffbeb', border: '#b4530930' },
    pending:    { label: '⏳ Pending Review', color: '#6b7280', bg: '#f9fafb', border: '#6b728030' },
  }
  const cfg = MAP[status] || MAP.pending
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

// ─── Override Modal ───────────────────────────────────────────────────────────

function OverrideModal({ challenge, categories, onClose, onSuccess }) {
  const ai = challenge.ai_classification || {}
  const [categoryName, setCategoryName] = useState(ai.final_category || ai.ai_category || '')
  const [priority, setPriority] = useState(challenge.priority || '')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await overrideAI(challenge.id, {
        action: 'override',
        category_name: categoryName,
        priority,
        override_reason: reason,
      })
      onSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Override failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="override-modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" id="override-modal-title">Override AI Classification</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 12, color: 'var(--gray-600)', marginBottom: 20 }}>
            <strong>Note:</strong> The original AI recommendation is preserved for audit. Only the active category and priority will change.
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="override-category">Category</label>
            <select id="override-category" className="form-control" value={categoryName} onChange={e => setCategoryName(e.target.value)}>
              <option value="">— Select category —</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="override-priority">Priority</label>
            <select id="override-priority" className="form-control" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="">— Keep current —</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="override-reason">Reason for Override</label>
            <textarea id="override-reason" className="form-control" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why the AI classification was overridden..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner spinner-sm" /> Saving...</> : 'Apply Override'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AI Classification Card ───────────────────────────────────────────────────

function AIClassificationCard({ challenge, ai, onUpdate, availableCategories, busy, setBusy }) {
  const [showOverride, setShowOverride] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const reviewStatus = ai.review_status || 'pending'
  const isAccepted   = reviewStatus === 'accepted'
  const isOverridden = reviewStatus === 'overridden'

  const handleAccept = async () => {
    setBusy(true)
    setActionMsg('')
    try {
      const { data } = await acceptAIResult(challenge.id)
      onUpdate(data)
    } catch {
      setActionMsg('Failed to accept classification. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleReprocess = async () => {
    if (!window.confirm('Re-run AI classification? This will clear any manual overrides and the current acceptance.')) return
    setBusy(true)
    setActionMsg('')
    try {
      const { data } = await reprocessAI(challenge.id)
      onUpdate(data)
    } catch {
      setActionMsg('Reprocessing failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleOverrideSuccess = (data) => {
    setShowOverride(false)
    onUpdate(data)
  }

  const finalCategory = isOverridden ? ai.manual_category : ai.ai_category

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="card-title">AI Classification</span>
          <ReviewStatusBadge status={reviewStatus} />
          {ai.source && <SourceBadge source={ai.source} />}
        </div>

        <div className="card-body">
          {actionMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{actionMsg}</div>}

          {/* ── Accepted State ── */}
          {(isAccepted || isOverridden) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Left: Final result */}
              <div>
                {/* Final Category */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: 6 }}>
                    {isOverridden ? 'Final Category (Admin Override)' : 'Final Category'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)' }}>
                    {finalCategory || '—'}
                  </div>
                  {isOverridden && (
                    <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                      AI suggested: <strong>{ai.ai_category}</strong>
                    </div>
                  )}
                </div>

                {/* Accepted by */}
                {isAccepted && ai.accepted_by && (
                  <div className="detail-row">
                    <span className="detail-label">Accepted By</span>
                    <span className="detail-value" style={{ fontWeight: 500 }}>{ai.accepted_by}</span>
                  </div>
                )}
                {isAccepted && ai.accepted_at && (
                  <div className="detail-row">
                    <span className="detail-label">Accepted On</span>
                    <span className="detail-value" style={{ fontSize: 12 }}>
                      {new Date(ai.accepted_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Divider + Original AI info */}
                <div style={{ borderTop: '1px solid var(--gray-100)', marginTop: 16, paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: 10 }}>
                    Original AI Suggestion
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">AI Category</span>
                    <span className="detail-value">{ai.ai_category || '—'}</span>
                  </div>
                  <ConfidenceBar value={ai.confidence} />
                  {ai.reason && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                      <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>Why this category?</strong>
                      {ai.reason}
                    </div>
                  )}
                  {ai.visual_evidence && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 6, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e40af' }}>
                        <span>📷</span> Visual Evidence
                      </strong>
                      {ai.visual_evidence}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ borderLeft: '1px solid var(--gray-100)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Admin Actions
                </div>

                {/* Disabled accept button shows accepted state */}
                <button
                  id="btn-accept-ai"
                  className="btn btn-secondary btn-sm"
                  disabled
                  style={{ opacity: 0.7, cursor: 'default' }}
                >
                  ✓ AI Result Accepted
                </button>

                <button
                  id="btn-override-ai"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowOverride(true)}
                  disabled={busy}
                >
                  ✎ Override Classification
                </button>
                <button
                  id="btn-reprocess-ai"
                  className="btn btn-ghost btn-sm"
                  onClick={handleReprocess}
                  disabled={busy}
                  style={{ fontSize: 12 }}
                >
                  ↺ Re-run AI
                </button>
              </div>
            </div>
          ) : (
            /* ── Pending State ── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Left: AI result */}
              <div>
                <div className="detail-row">
                  <span className="detail-label">AI Suggested Category</span>
                  <span className="detail-value" style={{ fontWeight: 600 }}>{ai.ai_category || '—'}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <ConfidenceBar value={ai.confidence} />
                </div>
                {ai.reason && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>Why this category?</strong>
                    {ai.reason}
                  </div>
                )}
                {ai.visual_evidence && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 6, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e40af' }}>
                      <span>📷</span> Visual Evidence
                    </strong>
                    {ai.visual_evidence}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div style={{ borderLeft: '1px solid var(--gray-100)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Admin Actions
                </div>
                <button
                  id="btn-accept-ai"
                  className="btn btn-primary btn-sm"
                  onClick={handleAccept}
                  disabled={busy || !ai.ai_category}
                >
                  {busy ? <><span className="spinner spinner-sm" /> Working...</> : '✓ Accept AI Result'}
                </button>
                <button
                  id="btn-override-ai"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowOverride(true)}
                  disabled={busy}
                >
                  ✎ Override Classification
                </button>
                <button
                  id="btn-reprocess-ai"
                  className="btn btn-ghost btn-sm"
                  onClick={handleReprocess}
                  disabled={busy}
                  style={{ fontSize: 12 }}
                >
                  ↺ Re-run AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showOverride && (
        <OverrideModal
          challenge={challenge}
          categories={availableCategories}
          onClose={() => setShowOverride(false)}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </>
  )
}

// ─── Priority Assessment Card ─────────────────────────────────────────────────

function PriorityAssessmentCard({ pd, ai }) {
  const breakdown = pd.breakdown || {}
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="card-title">Priority Assessment</span>
        {pd.level && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: pd.level === 'HIGH' ? '#fef2f2' : pd.level === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
            color:      pd.level === 'HIGH' ? '#dc2626' : pd.level === 'MEDIUM' ? '#b45309' : '#16a34a',
          }}>
            {pd.level}
          </span>
        )}
        {ai.manual_priority && (
          <span style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            Admin Override: {ai.manual_priority}
          </span>
        )}
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', fontWeight: 600, marginBottom: 10 }}>
              Priority Factors
            </div>
            <FactorRow label="Severity"            value={breakdown.severity} />
            <FactorRow label="Frequency"           value={breakdown.frequency} />
            <FactorRow label="Validation Evidence" value={breakdown.validation} />
            <FactorRow label="Affected Population" value={breakdown.affected_population} />
            <FactorRow label="Urgency"             value={breakdown.urgency} />
          </div>
          <div style={{ borderLeft: '1px solid var(--gray-100)', paddingLeft: 24 }}>
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                {Math.round(pd.score)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>out of 100</div>
            </div>
            {pd.reason && (
              <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>Why this priority?</strong>
                {pd.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AIClassificationPanel({ challenge, onUpdate, availableCategories = [] }) {
  const [busy, setBusy] = useState(false)

  const ai = challenge.ai_classification || {}
  const pd = challenge.priority_detail || {}

  const hasAIData = !!ai.ai_category
  const hasPriorityData = pd.score !== undefined

  if (!hasAIData) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">AI Classification</span></div>
        <div className="card-body">
          <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 13 }}>
            AI classification has not run for this challenge yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AIClassificationCard
        challenge={challenge}
        ai={ai}
        onUpdate={onUpdate}
        availableCategories={availableCategories}
        busy={busy}
        setBusy={setBusy}
      />
      {hasPriorityData && <PriorityAssessmentCard pd={pd} ai={ai} />}
    </>
  )
}
