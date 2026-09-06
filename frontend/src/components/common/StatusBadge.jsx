// StatusBadge — renders a colored badge for status/priority fields
const STATUS_MAP = {
  SUBMITTED:    'badge-submitted',
  UNDER_REVIEW: 'badge-under_review',
  ROUTED:       'badge-routed',
  IN_PROGRESS:  'badge-in_progress',
  COMPLETED:    'badge-completed',
  LOW:          'badge-low',
  MEDIUM:       'badge-medium',
  HIGH:         'badge-high',
  PENDING:      'badge-pending',
  ACTIVE:       'badge-active',
  REJECTED:     'badge-rejected',
  APPROVED:     'badge-approved',
  SUBMITTED_MS: 'badge-submitted-ms',
  CHANGES_REQUESTED: 'badge-changes_requested',
}

const STATUS_LABELS = {
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  ROUTED:       'Routed',
  IN_PROGRESS:  'In Progress',
  COMPLETED:    'Completed',
  LOW:          'Low',
  MEDIUM:       'Medium',
  HIGH:         'High',
  PENDING:      'Pending',
  ACTIVE:       'Active',
  REJECTED:     'Rejected',
  APPROVED:     'Approved',
  CHANGES_REQUESTED: 'Changes Requested',
}

export default function StatusBadge({ value, label }) {
  const key = value?.toUpperCase()
  const cssClass = STATUS_MAP[key] || 'badge-pending'
  const displayLabel = label || STATUS_LABELS[key] || value

  return (
    <span className={`badge ${cssClass}`}>
      {displayLabel}
    </span>
  )
}
