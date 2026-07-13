import { signOut } from 'aws-amplify/auth';

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '44px minmax(0, 1fr)',
        background: '#f3f6f9',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
          background: '#ffffff',
          borderBottom: '1px solid #e3e9ef',
        }}
      >
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
      <iframe
        src="/mike-dashboard.html"
        title="MIKE operations dashboard"
        style={{ width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}

export default App;
