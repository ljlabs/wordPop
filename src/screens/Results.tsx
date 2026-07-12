import type { GameResults } from '../types';

interface ResultsProps {
  results: GameResults;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
}

// Mock data for preview — used if results.words is empty
const MOCK_WORDS = [
  { word: 'STITCHING', points: 120 },
  { word: 'CAT', points: 15 },
  { word: 'MOUSE', points: 45 },
  { word: 'DOG', points: 12 },
  { word: 'HOUSE', points: 30 },
  { word: 'BRUTAL', points: 80 },
  { word: 'POP', points: 20 },
  { word: 'WORD', points: 25 },
];

export default function Results({ results, onPlayAgain, onLeaderboard }: ResultsProps) {
  const words = results.words.length > 0 ? results.words : MOCK_WORDS;
  const score = results.score || words.reduce((sum, w) => sum + w.points, 0);
  const longestWord = results.longestWord || words.reduce((best, w) => w.word.length > best.length ? w.word : best, '').word;

  return (
    <div className="flex flex-col min-h-dvh bg-surface pb-32">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 bg-surface border-b-2 border-on-surface neubrutalist-shadow sticky top-0 z-50">
        <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-on-surface bg-surface-container">
          <span className="material-symbols-outlined text-primary text-xl">menu</span>
        </button>
        <h1 className="font-display text-primary text-shadow-hard" style={{ fontSize: 'clamp(28px, 8vw, 48px)' }}>WORD POP!</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-on-surface bg-surface-container">
          <span className="material-symbols-outlined text-primary text-xl">settings</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 px-5 flex flex-col items-center max-w-lg mx-auto w-full">
        {/* Score Card */}
        <section className="w-full bg-surface-bright border-2 border-on-surface neubrutalist-shadow-lg rounded-xl p-5 flex flex-col items-center text-center mt-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full opacity-50 border-2 border-on-surface blur-sm mix-blend-multiply" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-secondary-container rounded-full opacity-50 border-2 border-on-surface blur-sm mix-blend-multiply" />
          <h2 className="font-title text-on-surface-variant mb-1 relative z-10 uppercase tracking-widest" style={{ fontSize: '20px' }}>Final Score</h2>
          <div className="font-display font-extrabold text-primary text-shadow-hard my-2 relative z-10 -rotate-2" style={{ fontSize: 'clamp(48px, 12vw, 72px)', lineHeight: 1.1 }}>
            {score.toLocaleString()}
          </div>
          <div className="w-full mt-2 grid grid-cols-2 gap-2 relative z-10">
            <div className="bg-surface-container border-2 border-on-surface rounded-lg p-3 flex flex-col items-center">
              <span className="font-label font-bold text-on-surface-variant uppercase" style={{ fontSize: '10px' }}>Total Words</span>
              <span className="font-headline text-on-surface mt-1" style={{ fontSize: '28px' }}>{words.length}</span>
            </div>
            <div className="bg-surface-container border-2 border-on-surface rounded-lg p-3 flex flex-col items-center">
              <span className="font-label font-bold text-on-surface-variant uppercase" style={{ fontSize: '10px' }}>Best Word</span>
              <span className="font-label font-bold text-on-surface mt-1 text-center break-all" style={{ fontSize: '14px' }}>
                {longestWord.toUpperCase()}
                <br />
                <span className="text-primary" style={{ fontSize: '12px' }}>
                  ({words.find((w) => w.word.toUpperCase() === longestWord.toUpperCase())?.points || 0} pts)
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* Found Words */}
        <section className="w-full mt-6 flex flex-col items-center">
          <h3 className="font-title mb-4 self-start" style={{ fontSize: '20px' }}>Found Words</h3>
          <div className="flex flex-wrap gap-2 justify-center w-full bg-surface-container p-4 rounded-xl border-2 border-on-surface neubrutalist-shadow-inset min-h-[150px]">
            {words.map((w, i) => {
              const isLong = w.word.length >= 6;
              const rotation = (i % 2 === 0 ? 1 : -1) * ((i % 3) + 1);
              return (
                <div
                  key={w.word}
                  className={`inline-flex items-center rounded-full border-2 border-on-surface neubrutalist-shadow font-label transition-transform hover:scale-105 ${
                    isLong
                      ? 'bg-secondary-container text-on-secondary-container px-3 py-1'
                      : 'bg-surface-bright text-on-surface px-3 py-1'
                  }`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    fontSize: isLong ? '18px' : '14px',
                  }}
                >
                  {w.word.toUpperCase()}
                  <span className={`ml-2 px-1 rounded-sm border border-on-surface ${isLong ? 'bg-surface text-on-surface' : 'bg-surface-variant text-on-surface-variant'}`} style={{ fontSize: '10px' }}>
                    {w.points}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="w-full flex flex-col gap-3 mt-8 mb-8">
          <button
            onClick={onPlayAgain}
            className="w-full bg-primary-container text-on-primary-container font-headline py-3 rounded-xl border-2 border-on-surface neubrutalist-shadow tactile-btn uppercase flex items-center justify-center gap-2"
            style={{ fontSize: '28px' }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            Play Again
          </button>
          <button
            onClick={onLeaderboard}
            className="w-full bg-surface-bright text-on-surface font-title py-3 rounded-xl border-2 border-on-surface neubrutalist-shadow tactile-btn flex items-center justify-center gap-2"
            style={{ fontSize: '20px' }}
          >
            <span className="material-symbols-outlined">leaderboard</span>
            Leaderboard
          </button>
        </section>
      </main>
    </div>
  );
}
