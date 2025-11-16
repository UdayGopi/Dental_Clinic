// Simple test to verify React is working
export default function TestApp() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red' }}>React is Working!</h1>
      <p>If you see this, React is loading correctly.</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  )
}

