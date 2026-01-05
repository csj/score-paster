import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import ScoreCard from '../components/ScoreCard';

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

const GAME_TYPES = [
  { value: 'wordle', label: 'Wordle' },
  { value: 'connections', label: 'Connections' },
  { value: 'digitparty', label: 'Digit Party' },
];

export default function GlobalLeaderboard() {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default to today's date and first game type
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGameType, setSelectedGameType] = useState(GAME_TYPES[0].value);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = `/api/scoreboards/global/scores/${selectedGameType}?date=${selectedDate}`;
        
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
  }, [selectedDate, selectedGameType]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

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
      <h1 style={{ marginBottom: '1rem' }}>Global Leaderboard</h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor="game-select" style={{ fontWeight: 'bold', minWidth: '80px' }}>
            Game:
          </label>
          <select
            id="game-select"
            value={selectedGameType}
            onChange={(e) => setSelectedGameType(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            {GAME_TYPES.map(game => (
              <option key={game.value} value={game.value}>
                {game.label}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor="date-select" style={{ fontWeight: 'bold', minWidth: '80px' }}>
            Date:
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            ({formatDate(selectedDate)})
          </span>
        </div>
      </div>
      
      {scores.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No scores for {GAME_TYPES.find(g => g.value === selectedGameType)?.label || selectedGameType} on {formatDate(selectedDate).toLowerCase()}.
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
