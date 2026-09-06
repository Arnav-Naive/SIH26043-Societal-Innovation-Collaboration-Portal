export default function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title && <div className="empty-state-title">{title}</div>}
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
      {action}
    </div>
  )
}
