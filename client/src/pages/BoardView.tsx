import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

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

export default function BoardView() {
  const { boardSlug } = useParams<{ boardSlug: string }>();
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardSlug) return;

    const fetchBoard = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest<Scoreboard>(`/api/scoreboards/${boardSlug}`);
        setScoreboard(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load scoreboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardSlug]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !scoreboard) {
    return (
      <div style={{ padding: '2rem', color: '#c62828' }}>
        {error || 'Scoreboard not found'}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{scoreboard.name}</h1>

      {!scoreboard.isGlobal && scoreboard.inviteCode && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
        }}>
          <strong>Invite Code:</strong> {scoreboard.inviteCode}
          <br />
          <small>Share this code with friends to join this scoreboard</small>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2>View Scores by Game</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Link
            to={`/boards/${boardSlug}/scores/wordle`}
            style={{
              padding: '1rem',
              backgroundColor: '#388e3c',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            View Wordle Scores
          </Link>
          <Link
            to={`/boards/${boardSlug}/scores/connections`}
            style={{
              padding: '1rem',
              backgroundColor: '#7b1fa2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            View Connections Scores
          </Link>
        </div>
      </div>
    </div>
  );
}