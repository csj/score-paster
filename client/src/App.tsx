import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Paste from './pages/Paste';
import GameLeaderboard from './pages/GameLeaderboard';
import BoardView from './pages/BoardView';
import MyBoards from './pages/MyBoards';
import CreateBoard from './pages/CreateBoard';
import { AuthProvider } from './services/auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/paste" element={<Paste />} />
          <Route path="/boards/:boardSlug" element={<BoardView />} />
          <Route path="/boards/:boardSlug/scores/:gameType" element={<GameLeaderboard />} />
          <Route path="/my-boards" element={<MyBoards />} />
          <Route path="/create-board" element={<CreateBoard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;