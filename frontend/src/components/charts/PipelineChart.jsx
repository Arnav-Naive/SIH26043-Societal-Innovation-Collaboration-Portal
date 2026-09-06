export default function PipelineChart({ data = [] }) {
  if (!data || data.length === 0) return <div>No pipeline data available.</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', overflowX: 'auto' }}>
      {data.map((step, idx) => (
        <div key={step.stage} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'var(--bg-card-hover)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            minWidth: '120px'
          }}>
            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {step.value}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {step.stage}
            </span>
          </div>
          {idx < data.length - 1 && (
            <div style={{ padding: '0 16px', color: 'var(--gray-400)' }}>
              ⟶
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
