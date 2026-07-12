import { useState, useCallback } from 'react';
import type { View, GridSize, GameResults } from './types';
import Home from './screens/Home';
import Game from './screens/Game';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    const saved = localStorage.getItem('wordpop_gridsize');
    return saved ? (parseInt(saved, 10) as GridSize) : 4;
  });
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  const navigateTo = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const startGame = useCallback((size: GridSize) => {
    setGridSize(size);
    localStorage.setItem('wordpop_gridsize', String(size));
    setCurrentView('game');
  }, []);

  const endGame = useCallback((results: GameResults) => {
    setGameResults(results);
    setCurrentView('results');
  }, []);

  const playAgain = useCallback(() => {
    setCurrentView('game');
  }, []);

  const goToHome = useCallback(() => {
    setCurrentView('home');
  }, []);

  const goToLeaderboard = useCallback(() => {
    setCurrentView('leaderboard');
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-surface text-on-surface font-body overflow-x-hidden">
      {/* Mobile: full width. Desktop: centered phone-width container */}
      <div className="app-container flex flex-col min-h-dvh">
        {currentView === 'home' && (
          <Home
            gridSize={gridSize}
            onSelectGridSize={setGridSize}
            onPlay={() => startGame(gridSize)}
            onNavigate={navigateTo}
          />
        )}
        {currentView === 'game' && (
          <Game
            gridSize={gridSize}
            onEndGame={endGame}
            onExit={goToHome}
          />
        )}
        {currentView === 'results' && gameResults && (
          <Results
            results={gameResults}
            onPlayAgain={playAgain}
            onLeaderboard={goToLeaderboard}
          />
        )}
        {currentView === 'leaderboard' && (
          <Leaderboard
            onNavigate={navigateTo}
            onPlayAgain={playAgain}
          />
        )}
      </div>
    </div>
  );
}

export default App;
