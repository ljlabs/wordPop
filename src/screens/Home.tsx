import type { GridSize } from '../types';
import { useAppStore } from '../stores/appStore';
import BottomNav from '../components/BottomNav';

const GRID_SIZES: GridSize[] = [4, 5, 6];

export default function Home() {
  const gridSize = useAppStore((s) => s.gridSize);
  const setGridSize = useAppStore((s) => s.setGridSize);
  const startGame = useAppStore((s) => s.startGame);
  return (
    <div className="flex flex-col min-h-dvh">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-5 py-4 bg-surface border-b-2 border-on-surface neubrutalist-shadow sticky top-0 z-50 shrink-0">
        <button className="tactile-btn flex items-center justify-center p-2 rounded-lg bg-surface">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h1 className="font-display text-on-surface text-shadow-hard tracking-tight" style={{ fontSize: 'clamp(28px, 8vw, 48px)' }}>
          WORD POP!
        </h1>
        <button className="tactile-btn flex items-center justify-center p-2 rounded-lg bg-surface">
          <span className="material-symbols-outlined text-2xl">settings</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-stretch px-5 py-6 pb-28 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full">
          {/* Hero Section — large card with mini grid */}
          <div className="w-full bg-surface-container-highest border-2 border-on-surface rounded-2xl neubrutalist-shadow-lg flex items-center justify-center relative overflow-hidden group mb-6"
               style={{ height: 'min(55vw, 320px)' }}>
            <div className="absolute inset-0 bg-primary-container opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
            {/* 3x3 mini letter grid */}
            <div className="grid grid-cols-3 gap-3 p-6 relative z-10" style={{ width: '70%', maxWidth: '200px' }}>
              <HeroTile letter="W" color="bg-primary-container" />
              <HeroTile letter="O" color="bg-surface" />
              <HeroTile letter="R" color="bg-surface" />
              <HeroTile letter="D" color="bg-surface" />
              <HeroTile letter="P" color="bg-secondary-container" />
              <HeroTile letter="O" color="bg-surface" />
              <HeroTile letter="P" color="bg-surface" />
              <HeroTile letter="!" color="bg-surface" />
              <HeroTile letter="" color="bg-tertiary-container" icon="star" />
            </div>
          </div>

          {/* Play Button */}
          <div className="w-full mb-6">
            <button
              onClick={startGame}
              className="tactile-btn w-full bg-primary-container text-on-surface rounded-xl py-5 px-8 neubrutalist-shadow-lg font-headline tracking-wide uppercase flex items-center justify-center gap-3"
              style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '36px' }}>play_arrow</span>
              PLAY
            </button>
          </div>

          {/* Grid Size Selector */}
          <div className="w-full">
            <h2 className="font-title text-on-surface mb-3 px-1" style={{ fontSize: '20px' }}>Grid Size</h2>
            <div className="grid grid-cols-3 gap-3">
              {GRID_SIZES.map((size) => {
                const isSelected = gridSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`tactile-btn flex flex-col items-center justify-center border-2 border-on-surface rounded-xl py-4 px-2 neubrutalist-shadow-sm relative ${
                      isSelected
                        ? 'bg-secondary-container'
                        : 'bg-surface opacity-80'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 bg-on-surface text-surface rounded-full w-6 h-6 flex items-center justify-center border-2 border-on-surface z-10" style={{ fontSize: '10px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                      </span>
                    )}
                    {/* Mini dot grid preview */}
                    <div
                      className="grid gap-[2px] mb-3 w-10 h-10"
                      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
                    >
                      {Array.from({ length: size * size }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-full h-full rounded-[1px] ${isSelected ? 'bg-on-surface' : 'bg-on-surface-variant opacity-50'}`}
                        />
                      ))}
                    </div>
                    <span className={`font-label font-bold ${isSelected ? '' : 'text-on-surface-variant'}`} style={{ fontSize: '14px' }}>{size}x{size}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav active="home" />
    </div>
  );
}

function HeroTile({ letter, color, icon }: { letter: string; color: string; icon?: string }) {
  return (
    <div className={`${color} border-2 border-on-surface rounded-lg neubrutalist-shadow-sm flex items-center justify-center aspect-square`}>
      {icon ? (
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 'clamp(24px, 6vw, 36px)' }}>{icon}</span>
      ) : (
        <span className="font-headline text-on-surface" style={{ fontSize: 'clamp(24px, 7vw, 36px)' }}>{letter}</span>
      )}
    </div>
  );
}
