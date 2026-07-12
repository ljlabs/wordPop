import type { View } from '../types';

interface BottomNavProps {
  active: string;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS = [
  { id: 'play' as const, icon: 'videogame_asset', label: 'Play' },
  { id: 'leaderboard' as const, icon: 'leaderboard', label: 'Rank' },
  { id: 'help' as const, icon: 'help_outline', label: 'Help' },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface border-t-2 border-on-surface neubrutalist-shadow">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'play' || item.id === 'leaderboard') {
                onNavigate(item.id);
              }
            }}
            className={`flex flex-col items-center justify-center px-4 py-1 font-label font-bold transition-all active:scale-95 ${
              isActive
                ? 'bg-primary-container text-on-primary-container border-2 border-on-surface rounded-xl neubrutalist-shadow-sm'
                : 'text-on-surface-variant'
            }`}
            style={{ fontSize: '14px' }}
          >
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
