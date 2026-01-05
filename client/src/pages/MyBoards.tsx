import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../services/auth';

interface Scoreboard {
  id: string;
  slug: string | null;
  name: string;
  isGlobal: boolean;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: string;
}

export default function MyBoards() {
  const { user } = useAuth();
  const [scoreboards, setScoreboards] = useState<Scoreboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBoards = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest<Scoreboard[]>('/api/scoreboards/my-boards');
        setScoreboards(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load scoreboards');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Please log in to view your scoreboards
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#c62828' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Scoreboards</h1>
        <Link
          to="/create-board"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1976d2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Create New
        </Link>
      </div>

      {scoreboards.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          You haven't joined any scoreboards yet.
          <br />
          <Link to="/create-board" style={{ color: '#1976d2' }}>
            Create one
          </Link>{' '}
          or join one with an invite code.
        </div>
      ) : (
        <div>
          {scoreboards.map((board) => (
            <div
              key={board.id}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Link
                to={`/boards/${board.slug || 'global'}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>{board.name}</h3>
              </Link>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {board.memberIds.length} member{board.memberIds.length !== 1 ? 's' : ''}
                {board.ownerId === user.id && ' • You own this board'}
              </div>
              {!board.isGlobal && board.inviteCode && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <strong>Invite Code:</strong> {board.inviteCode}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}