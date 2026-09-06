import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#1a4f8a', '#2d6bbf', '#3a7dd6', '#5b9bd5', '#7ab5e0', '#9ac8e8', '#b8d9f0']

export default function CategoryChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 200 }}>
        <div className="empty-state-sub">No data available</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
        barSize={32}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(26,79,138,0.04)' }}
          contentStyle={{
            border: '1px solid #e2e6ea',
            borderRadius: 6,
            fontSize: 13,
            boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
          }}
          formatter={(value) => [value, 'Challenges']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
