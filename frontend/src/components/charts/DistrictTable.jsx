export default function DistrictTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 120 }}>
        <div className="empty-state-sub">No district data available</div>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>District</th>
            <th>Total</th>
            <th>In Progress</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.district}>
              <td className="table-cell-title">{row.district}</td>
              <td>{row.total}</td>
              <td>{row.in_progress}</td>
              <td>{row.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
