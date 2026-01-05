import { Link } from 'react-router-dom';
import LoginButtons from '../components/LoginButtons';
import { useAuth } from '../services/auth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Score Paster</h1>
        <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          Share and compare your game scores with friends
        </p>
        <LoginButtons />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome, {user.displayName}!</h1>
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto' }}>
        <Link
          to="/paste"
          style={{
            padding: '1rem',
            backgroundColor: '#1976d2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Paste Score
        </Link>
        <Link
          to="/my-boards"
          style={{
            padding: '1rem',
            backgroundColor: '#424242',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          My Scoreboards
        </Link>
        <Link
          to="/boards/global/scores/wordle"
          style={{
            padding: '1rem',
            backgroundColor: '#388e3c',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Global Wordle Leaderboard
        </Link>
        <Link
          to="/boards/global/scores/connections"
          style={{
            padding: '1rem',
            backgroundColor: '#7b1fa2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Global Connections Leaderboard
        </Link>
      </div>
    </div>
  );
}