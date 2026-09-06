export default function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  )
}
