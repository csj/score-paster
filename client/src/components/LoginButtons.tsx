export default function LoginButtons() {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
      <button
        onClick={handleGoogleLogin}
        style={{
          padding: '1rem',
          fontSize: '1rem',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Sign in with Google
      </button>
      <button
        onClick={handleMicrosoftLogin}
        style={{
          padding: '1rem',
          fontSize: '1rem',
          backgroundColor: '#00a4ef',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}