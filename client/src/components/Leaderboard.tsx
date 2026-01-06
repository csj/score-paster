import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import ScoreCard from './ScoreCard';

interface Score {
  id: string;
  userId: string;
  gameType: string;
  gameDate: string;
  scoreData: any;
  createdAt: string;
  rawPaste?: string;
  user?: {
    id: string;
    username?: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
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
  
  // Helper to get today's date in local timezone (not UTC)
  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default to today's date
  const today = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = `/api/scoreboards/${boardSlug}/scores/${gameType}?date=${selectedDate}`;
        
        const data = await apiRequest<{ scoreboard: Scoreboard; gameType: string; gameDate: string; scores: Score[] }>(url);
        setScoreboard(data.scoreboard);
        setScores(data.scores);
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [boardSlug, gameType, selectedDate]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const todayLocal = getTodayLocal();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLocal = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    if (dateStr === todayLocal) {
      return 'Today';
    } else if (dateStr === yesterdayLocal) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>{scoreboard.name} - {gameType}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="date-select" style={{ fontSize: '0.875rem', color: '#666' }}>
            Date:
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today} // Can't select future dates
            style={{
              padding: '0.5rem',
              fontSize: '0.875rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        {formatDate(selectedDate)}
      </div>
      
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
          No scores for {gameType} on {formatDate(selectedDate).toLowerCase()}.
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {scores.map((score, index) => (
            <ScoreCard
              key={score.id}
              score={score}
              rank={index + 1}
              user={score.user || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}