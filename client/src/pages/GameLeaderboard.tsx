import { useParams } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';

export default function GameLeaderboard() {
  const { boardSlug, gameType } = useParams<{ boardSlug: string; gameType: string }>();
  
  if (!boardSlug || !gameType) {
    return <div>Invalid board or game type</div>;
  }
  
  return <Leaderboard boardSlug={boardSlug} gameType={gameType} />;
}