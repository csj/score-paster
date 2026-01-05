import { useState } from 'react';
import RawPasteModal from './RawPasteModal';

interface ScoreCardProps {
  score: {
    id: string;
    userId: string;
    gameType: string;
    gameDate: string;
    scoreData: any;
    createdAt: string;
    rawPaste?: string;
  };
  rank?: number;
  user?: {
    id: string;
    username?: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export default function ScoreCard({ score, rank, user }: ScoreCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formatScore = () => {
    // Use displayScore if available
    if (score.scoreData.displayScore) {
      return score.scoreData.displayScore;
    }
    
    // Fallback for legacy scores (shouldn't happen with new parsers)
    return JSON.stringify(score.scoreData);
  };

  const displayUserName = user?.username || user?.displayName || score.userId;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
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
            {displayUserName}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {score.gameDate} • {formatScore()}
          </div>
        </div>
      
      {user?.avatarUrl && !avatarError ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          onError={() => setAvatarError(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
          }}
        />
      ) : (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: '#666',
            fontWeight: 'bold',
          }}
          title={displayUserName}
        >
          {displayUserName.charAt(0).toUpperCase()}
        </div>
      )}
      </div>
      
      <RawPasteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        rawPaste={score.rawPaste || ''}
        userName={displayUserName}
        gameDate={score.gameDate}
      />
    </>
  );
}