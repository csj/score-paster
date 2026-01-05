interface ScoreCardProps {
  score: {
    id: string;
    userId: string;
    gameType: string;
    gameDate: string;
    scoreData: any;
    createdAt: string;
  };
  rank?: number;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export default function ScoreCard({ score, rank, user }: ScoreCardProps) {
  const formatScore = () => {
    // Use displayScore if available
    if (score.scoreData.displayScore) {
      return score.scoreData.displayScore;
    }
    
    // Fallback for legacy scores (shouldn't happen with new parsers)
    return JSON.stringify(score.scoreData);
  };

  return (
    <div style={{
      padding: '1rem',
      marginBottom: '0.5rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      {rank !== undefined && (
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#666',
          minWidth: '2rem',
          textAlign: 'center',
        }}>
          #{rank}
        </div>
      )}
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {user?.displayName || score.userId}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {score.gameDate} • {formatScore()}
        </div>
      </div>
      
      {user?.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );
}