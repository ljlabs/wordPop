import { useState } from 'react';
import type { View, GameRecord } from '../types';
import { loadGames } from '../lib/storage';
import BottomNav from '../components/BottomNav';

interface LeaderboardProps {
  onNavigate: (view: View) => void;
  onPlayAgain: () => void;
}

// Hardcoded podium avatars from the mockup
const PODIUM_AVATARS = {
  1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS-G6G095bNcBQihdNwrQJ3I24WIffkuhar5e5WjwkaF2Yu2O4wpK-n7MEgTHM8VswSkJmgROFp37VRqXDf5ZytQCOoNoUg0DWg9PwaTVV5QLH02Q5SaKjHxep7O6yR7M_h2jq037XGWTvcQO5nk8q1Dmpc3Jw5fnsjev5qTJtb1TwhcOGmf17z6eL-mO-fn8TpWPxXXV-nyz5YxCZW8DK6YmmS7EfUtYaov1NEyKZpNKG3JUGKZTrR47LfZcih8h7o0IBKcUbG-E',
  2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcklUyIGI2eQny1syExaF4iqGpe8Fmo8TqHu39zkXAN4h6itlKVpN0amJx2wUcZEYKEYI126O7c89ZyYYSnDl-Fw7LTdHjTBM76Tk4dsEtr5QxuKlGfycaJosRDXTKJPCi0Qzn2SPZTEz4RtWLENhNoCPUNKV-7u_zvC4kEugASKJnZZBCLN76cGF4XvLupnnHThX13euSMp1Ne122dB6wWPLeCNzeWMJWf3VuCeb5P8-Fq5kpipFb0qiSeLpwUIsTezYAZPaTxDw',
  3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBak8D5bnQOEIFoo5MqEC9MrBMtPQ5AvwLkU5KJj-3YGuiGUyPN32gDzyPAYgYMhcvUApqs1f0AdIUo8-PN2SqcLggX7EKjaoaQVBwkdkwfYXhyvcWiPFBrwlbbC7IBAncnAHdxLaY4g9MTjG_C11XOc4nYXjUS4AEu_e3wo6wO1mHcdX1H6oKV4sV6X9lIoKyW_Cya3K5C-5uRIv3QgZ0fOxeW4RRfv7HZ1bCWhuXYS0HLxkRFNJcwBtQMna8IVpyaGiHK-DuE_3A',
};

// Mock data — 6+ games per grid size so podium + table are always visible
// Dates include varied times (hours/minutes) for realistic display
const MOCK_GAMES: GameRecord[] = [
  // 4x4
  { id: '1', score: 15920, gridSize: 4, words: [], longestWord: 'CHALLENGE', date: Date.now() - 86400000 * 3 - 3600000 * 14 - 60000 * 32, duration: 90, avatarIndex: 0 },
  { id: '2', score: 12450, gridSize: 4, words: [], longestWord: 'STARLIGHT', date: Date.now() - 86400000 * 2 - 3600000 * 9 - 60000 * 15, duration: 85, avatarIndex: 1 },
  { id: '3', score: 11800, gridSize: 4, words: [], longestWord: 'BRAVADO', date: Date.now() - 86400000 - 3600000 * 18 - 60000 * 47, duration: 90, avatarIndex: 2 },
  { id: '4', score: 10210, gridSize: 4, words: [], longestWord: 'JUMPEY', date: Date.now() - 86400000 * 4 - 3600000 * 6 - 60000 * 5, duration: 78, avatarIndex: 3 },
  { id: '5', score: 9850, gridSize: 4, words: [], longestWord: 'ROBOTIC', date: Date.now() - 86400000 * 5 - 3600000 * 21 - 60000 * 55, duration: 90, avatarIndex: 4 },
  { id: '6', score: 9100, gridSize: 4, words: [], longestWord: 'ALIASES', date: Date.now() - 86400000 * 6 - 3600000 * 3 - 60000 * 22, duration: 82, avatarIndex: 5 },
  // 5x5
  { id: '7', score: 18300, gridSize: 5, words: [], longestWord: 'FREIGHTS', date: Date.now() - 86400000 - 3600000 * 11 - 60000 * 8, duration: 90, avatarIndex: 6 },
  { id: '8', score: 14200, gridSize: 5, words: [], longestWord: 'MISPLAY', date: Date.now() - 86400000 * 3 - 3600000 * 16 - 60000 * 41, duration: 88, avatarIndex: 7 },
  { id: '9', score: 11500, gridSize: 5, words: [], longestWord: 'STRETCH', date: Date.now() - 86400000 * 5 - 3600000 * 8 - 60000 * 19, duration: 90, avatarIndex: 0 },
  { id: '10', score: 9750, gridSize: 5, words: [], longestWord: 'REPLAYS', date: Date.now() - 86400000 * 7 - 3600000 * 20 - 60000 * 33, duration: 80, avatarIndex: 1 },
  { id: '11', score: 8400, gridSize: 5, words: [], longestWord: 'TRAMPLE', date: Date.now() - 86400000 * 4 - 3600000 * 13 - 60000 * 50, duration: 85, avatarIndex: 2 },
  { id: '12', score: 7200, gridSize: 5, words: [], longestWord: 'WARPED', date: Date.now() - 86400000 * 8 - 3600000 * 5 - 60000 * 12, duration: 90, avatarIndex: 3 },
  // 6x6
  { id: '13', score: 21000, gridSize: 6, words: [], longestWord: 'STRETCHED', date: Date.now() - 86400000 * 2 - 3600000 * 19 - 60000 * 27, duration: 90, avatarIndex: 4 },
  { id: '14', score: 16800, gridSize: 6, words: [], longestWord: 'QUARTZES', date: Date.now() - 86400000 * 4 - 3600000 * 7 - 60000 * 58, duration: 87, avatarIndex: 5 },
  { id: '15', score: 13200, gridSize: 6, words: [], longestWord: 'MISPLACED', date: Date.now() - 86400000 - 3600000 * 22 - 60000 * 3, duration: 90, avatarIndex: 6 },
  { id: '16', score: 10500, gridSize: 6, words: [], longestWord: 'WHACKED', date: Date.now() - 86400000 * 6 - 3600000 * 10 - 60000 * 44, duration: 82, avatarIndex: 7 },
  { id: '17', score: 8900, gridSize: 6, words: [], longestWord: 'FLEXING', date: Date.now() - 86400000 * 3 - 3600000 * 15 - 60000 * 17, duration: 90, avatarIndex: 0 },
  { id: '18', score: 7500, gridSize: 6, words: [], longestWord: 'JUMPSUIT', date: Date.now() - 86400000 * 9 - 3600000 * 2 - 60000 * 36, duration: 75, avatarIndex: 1 },
];

type FilterSize = 4 | 5 | 6;

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} · ${hours}:${mins}`;
}

export default function Leaderboard({ onNavigate, onPlayAgain }: LeaderboardProps) {
  const realGames = loadGames();
  const allGames = realGames.length > 0 ? realGames : MOCK_GAMES;
  const [filter, setFilter] = useState<FilterSize>(4);

  const filteredGames = allGames.filter((g) => g.gridSize === filter);
  const sortedGames = [...filteredGames].sort((a, b) => b.score - a.score);
  const top3 = sortedGames.slice(0, 3);
  const rest = sortedGames.slice(3);

  const filters: { label: string; value: FilterSize }[] = [
    { label: '4x4', value: 4 },
    { label: '5x5', value: 5 },
    { label: '6x6', value: 6 },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-surface pb-32">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 bg-surface border-b-2 border-on-surface neubrutalist-shadow sticky top-0 z-50 shrink-0">
        <button className="w-10 h-10 flex items-center justify-center border-2 border-on-surface rounded-xl bg-surface neubrutalist-shadow transition-all">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu</span>
        </button>
        <h1 className="font-headline text-primary text-shadow-hard" style={{ fontSize: 'clamp(20px, 6vw, 32px)' }}>WORD POP!</h1>
        <button className="w-10 h-10 flex items-center justify-center border-2 border-on-surface rounded-xl bg-surface neubrutalist-shadow transition-all">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-5 max-w-lg mx-auto w-full">
        {/* Title */}
        <h2 className="font-headline text-on-surface mb-4 text-center" style={{ fontSize: '32px' }}>Leaderboard</h2>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-2 bg-surface-container border-2 border-on-surface rounded-xl neubrutalist-shadow w-full mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-2 font-label font-bold rounded-lg transition-all border-2 ${
                filter === f.value
                  ? 'bg-primary-container text-on-primary-container border-on-surface neubrutalist-shadow-sm'
                  : 'bg-surface hover:bg-surface-variant text-on-surface border-transparent hover:border-on-surface'
              }`}
              style={{ fontSize: '14px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sortedGames.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-6">📝</div>
            <p className="font-title text-on-surface-variant mb-6" style={{ fontSize: '20px' }}>
              No games played yet — tap Play to set your first high score!
            </p>
            <button
              onClick={onPlayAgain}
              className="tactile-btn bg-primary-container text-on-primary-container font-headline py-3 px-8 rounded-xl border-2 border-on-surface neubrutalist-shadow-lg uppercase flex items-center justify-center gap-2"
              style={{ fontSize: '28px' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              PLAY
            </button>
          </div>
        ) : (
          <>
            {/* Podium — hardcoded avatars */}
            {top3.length >= 2 && (
              <div className="grid grid-cols-3 gap-3 mb-8 items-end">
                {/* Rank 2 (Silver) — Cat */}
                {top3[1] && (
                  <div className="flex flex-col items-center bg-surface-bright border-2 border-on-surface rounded-xl px-3 pt-10 pb-4 neubrutalist-shadow relative border-t-8 border-t-surface-dim"
                       style={{ minHeight: '200px' }}>
                    <div className="absolute -top-6 bg-surface-dim border-2 border-on-surface w-12 h-12 rounded-full flex items-center justify-center neubrutalist-shadow z-10">
                      <span className="font-title text-on-surface font-bold" style={{ fontSize: '20px' }}>2</span>
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-on-surface overflow-hidden mb-3">
                      <img src={PODIUM_AVATARS[2]} alt="Cat avatar" className="w-full h-full object-cover" />
                    </div>
                    <p className="font-title text-primary mt-auto font-bold" style={{ fontSize: '22px' }}>{top3[1].score.toLocaleString()}</p>
                  </div>
                )}
                {/* Rank 1 (Gold) — Rocket */}
                {top3[0] && (
                  <div className="flex flex-col items-center bg-primary-container border-2 border-on-surface rounded-xl px-3 pt-12 pb-4 neubrutalist-shadow-lg relative border-t-8 border-t-primary z-10 -translate-y-3"
                       style={{ minHeight: '240px' }}>
                    <div className="absolute -top-8 bg-primary border-2 border-on-surface w-16 h-16 rounded-full flex items-center justify-center neubrutalist-shadow z-10">
                      <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                    <div className="w-20 h-20 rounded-full border-2 border-on-surface overflow-hidden mb-3 bg-surface">
                      <img src={PODIUM_AVATARS[1]} alt="Rocket avatar" className="w-full h-full object-cover" />
                    </div>
                    <p className="font-headline text-on-primary-container mt-auto font-bold" style={{ fontSize: '28px' }}>{top3[0].score.toLocaleString()}</p>
                  </div>
                )}
                {/* Rank 3 (Bronze) — Pizza */}
                {top3[2] && (
                  <div className="flex flex-col items-center bg-surface-bright border-2 border-on-surface rounded-xl px-3 pt-10 pb-4 neubrutalist-shadow relative border-t-8 border-t-secondary"
                       style={{ minHeight: '180px' }}>
                    <div className="absolute -top-6 bg-secondary border-2 border-on-surface w-12 h-12 rounded-full flex items-center justify-center neubrutalist-shadow z-10">
                      <span className="font-title text-on-secondary font-bold" style={{ fontSize: '20px' }}>3</span>
                    </div>
                    <div className="w-14 h-14 rounded-full border-2 border-on-surface overflow-hidden mb-3">
                      <img src={PODIUM_AVATARS[3]} alt="Pizza avatar" className="w-full h-full object-cover" />
                    </div>
                    <p className="font-title text-primary mt-auto font-bold" style={{ fontSize: '18px' }}>{top3[2].score.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {/* List — ranks 4+, no avatars, just position + date + score */}
            <div className="flex flex-col gap-3">
              {rest.map((game, i) => (
                <div
                  key={game.id}
                  className="flex items-center p-4 bg-surface border-2 border-on-surface rounded-xl neubrutalist-shadow"
                >
                  {/* Rank number */}
                  <div className="w-10 font-title text-on-surface-variant text-center font-bold" style={{ fontSize: '20px' }}>{i + 4}</div>
                  {/* Date */}
                  <div className="flex-1 font-label text-on-surface-variant ml-4" style={{ fontSize: '14px' }}>{formatDate(game.date)}</div>
                  {/* Score */}
                  <div className="font-title text-on-surface font-bold" style={{ fontSize: '20px' }}>{game.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <BottomNav active="leaderboard" onNavigate={onNavigate} />
    </div>
  );
}
