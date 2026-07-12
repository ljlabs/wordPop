import { useAppStore } from './stores/appStore';
import Home from './screens/Home';
import Game from './screens/Game';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';

function App() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <div className="min-h-dvh flex flex-col bg-surface text-on-surface font-body overflow-x-hidden">
      {/* Mobile: full width. Desktop: centered phone-width container */}
      <div className="app-container flex flex-col min-h-dvh">
        {currentView === 'home' && <Home />}
        {currentView === 'game' && <Game />}
        {currentView === 'results' && <Results />}
        {currentView === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
}

export default App;
