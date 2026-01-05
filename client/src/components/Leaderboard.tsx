import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import ScoreCard from './ScoreCard';

interface Score {
  id: string;
  userId: string;
  gameType: string;
  gameDate: string;
  scoreData: any;
  createdAt: string;
}

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

interface LeaderboardProps {
  boardSlug: string;
  gameType: string;
}

export default function Leaderboard({ boardSlug, gameType }: LeaderboardProps) {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = `/api/scoreboards/${boardSlug}/scores/${gameType}`;
        
        const data = await apiRequest<{ scoreboard: Scoreboard; gameType: string; scores: Score[] }>(url);
        setScoreboard(data.scoreboard);
        setScores(data.scores);
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [boardSlug, gameType]);

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

  if (!scoreboard) {
    return <div style={{ padding: '2rem' }}>Scoreboard not found</div>;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{scoreboard.name} - {gameType}</h1>
      
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
      
      {scores.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No scores yet for {gameType}. Be the first to submit!
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {scores.map((score, index) => (
            <ScoreCard
              key={score.id}
              score={score}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}