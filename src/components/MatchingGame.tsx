import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import confetti from 'canvas-confetti';
import { Grid2X2, Timer, Trophy, RotateCcw, Check, Sparkles } from 'lucide-react';

interface MatchingGameProps {
  concepts: Concept[];
  onFinishMatching: (score: number) => void;
}

interface TileItem {
  id: string; // unique item id
  conceptId: string;
  text: string;
  type: 'term' | 'definition';
  emoji?: string;
  matched: boolean;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  concepts,
  onFinishMatching,
}) => {
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([]);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const GAME_PAIRS_COUNT = 6;

  // Initialize matching grid tiles
  const initGame = () => {
    // Select random concepts
    const shuffledConcepts = [...concepts].sort(() => 0.5 - Math.random()).slice(0, GAME_PAIRS_COUNT);

    const termTiles: TileItem[] = shuffledConcepts.map(c => ({
      id: `term-${c.id}`,
      conceptId: c.id,
      text: c.term,
      type: 'term',
      emoji: c.emoji,
      matched: false,
    }));

    const defTiles: TileItem[] = shuffledConcepts.map(c => ({
      id: `def-${c.id}`,
      conceptId: c.id,
      text: c.simpleDefinition,
      type: 'definition',
      matched: false,
    }));

    const combined = [...termTiles, ...defTiles].sort(() => 0.5 - Math.random());
    setTiles(combined);
    setSelectedTileId(null);
    setWrongPairIds([]);
    setTimeSeconds(0);
    setIsTimerRunning(true);
    setMatchedPairsCount(0);
    setStreak(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && !isGameOver) {
      timer = setInterval(() => {
        setTimeSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, isGameOver]);

  const handleTileClick = (clickedTile: TileItem) => {
    if (clickedTile.matched || isGameOver) return;
    if (wrongPairIds.length > 0) return; // currently showing wrong shake state

    if (!selectedTileId) {
      // First tile selected
      setSelectedTileId(clickedTile.id);
      return;
    }

    if (selectedTileId === clickedTile.id) {
      // Deselect if clicked same tile
      setSelectedTileId(null);
      return;
    }

    const firstTile = tiles.find(t => t.id === selectedTileId);
    if (!firstTile) return;

    // Check match
    if (firstTile.conceptId === clickedTile.conceptId && firstTile.type !== clickedTile.type) {
      // MATCH FOUND!
      const updatedTiles = tiles.map(t => 
        t.conceptId === clickedTile.conceptId ? { ...t, matched: true } : t
      );
      setTiles(updatedTiles);
      setSelectedTileId(null);
      const newMatched = matchedPairsCount + 1;
      setMatchedPairsCount(newMatched);
      setStreak(prev => prev + 1);

      // Check game win
      if (newMatched === GAME_PAIRS_COUNT) {
        setIsTimerRunning(false);
        setIsGameOver(true);
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
        onFinishMatching(Math.max(10, 100 - timeSeconds));
      }
    } else {
      // MISMATCH
      setStreak(0);
      setWrongPairIds([selectedTileId, clickedTile.id]);
      setTimeout(() => {
        setWrongPairIds([]);
        setSelectedTileId(null);
      }, 800);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Grid2X2 className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="font-bold text-neutral-900 text-sm">Asociación de Conceptos</h2>
            <p className="text-[11px] text-neutral-500">Relaciona cada término con su definición correcta</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Multiplier */}
          {streak > 1 && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Racha x{streak}!</span>
            </div>
          )}

          {/* Timer Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900 text-white font-mono text-xs font-bold shadow">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>{Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, '0')}</span>
          </div>

          <button
            onClick={initGame}
            id="reset-matching-game-btn"
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
            title="Reiniciar juego"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME OVER WIN SCREEN */}
      {isGameOver ? (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-neutral-900">¡Asociación Perfecta! 🎯</h3>
            <p className="text-sm text-neutral-600">
              Completaste todas las parejas en solo <strong className="text-neutral-900">{timeSeconds} segundos</strong>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={initGame}
              id="play-again-matching-btn"
              className="px-6 py-3 rounded-2xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition shadow"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      ) : (
        /* TILES GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tiles.map((tile) => {
            if (tile.matched) {
              return (
                <div 
                  key={tile.id}
                  className="h-28 sm:h-32 rounded-2xl bg-emerald-50/50 border border-emerald-200/50 flex flex-col items-center justify-center text-center p-3 opacity-40 select-none"
                >
                  <Check className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-emerald-800 line-clamp-2">{tile.text}</span>
                </div>
              );
            }

            const isSelected = selectedTileId === tile.id;
            const isWrong = wrongPairIds.includes(tile.id);

            let cardStyle = 'bg-white border-neutral-200 text-neutral-800 hover:border-amber-400 hover:shadow-md';
            if (isSelected) {
              cardStyle = 'bg-amber-50 border-2 border-amber-500 text-amber-950 font-bold shadow-lg scale-102 ring-2 ring-amber-200';
            } else if (isWrong) {
              cardStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold animate-shake';
            }

            return (
              <button
                key={tile.id}
                id={`tile-btn-${tile.id}`}
                onClick={() => handleTileClick(tile)}
                className={`h-28 sm:h-32 rounded-2xl border p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${cardStyle}`}
              >
                {tile.type === 'term' ? (
                  <div className="space-y-1">
                    <span className="text-2xl block">{tile.emoji}</span>
                    <span className="text-xs sm:text-sm font-extrabold leading-snug line-clamp-2">
                      {tile.text}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs font-medium leading-tight line-clamp-4">
                    "{tile.text}"
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};
