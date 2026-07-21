import React, { useState, useEffect } from 'react';
import { Concept, Difficulty } from '../types';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle,
  Filter,
  Layers,
  Flame
} from 'lucide-react';

interface FlashcardsViewProps {
  concepts: Concept[];
  selectedTopicFilter: string | null;
  setSelectedTopicFilter: (topic: string | null) => void;
  onRateConcept: (conceptId: string, rating: 'difficult' | 'medium' | 'easy') => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  concepts,
  selectedTopicFilter,
  setSelectedTopicFilter,
  onRateConcept,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter concepts based on controls
  const filteredConcepts = concepts.filter(c => {
    if (selectedTopicFilter && c.topic !== selectedTopicFilter) return false;
    if (difficultyFilter !== 'all' && c.difficulty !== difficultyFilter) return false;
    return true;
  });

  const currentCard = filteredConcepts[currentIndex] || filteredConcepts[0];

  // Reset index on filter change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedTopicFilter, difficultyFilter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredConcepts.length, currentIndex]);

  const handleNext = () => {
    if (filteredConcepts.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredConcepts.length);
  };

  const handlePrev = () => {
    if (filteredConcepts.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredConcepts.length) % filteredConcepts.length);
  };

  const handleRating = (rating: 'difficult' | 'medium' | 'easy') => {
    if (!currentCard) return;
    onRateConcept(currentCard.id, rating);
    handleNext();
  };

  // Text-to-Speech using browser Web Speech API
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const textToRead = `${currentCard.term}. ${currentCard.simpleDefinition}. Ejemplo: ${currentCard.practicalExample}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!currentCard || filteredConcepts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-neutral-200">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
          🔍
        </div>
        <h3 className="text-lg font-bold text-neutral-900">No se encontraron flashcards</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-6">No hay conceptos que coincidan con los filtros seleccionados.</p>
        <button
          onClick={() => {
            setSelectedTopicFilter(null);
            setDifficultyFilter('all');
          }}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-medium text-xs shadow hover:bg-neutral-800 transition"
        >
          Limpiar filtros
        </button>
      </div>
    );
  }

  const difficultyColors: Record<Difficulty, string> = {
    'fácil': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'medio': 'bg-amber-50 text-amber-700 border-amber-200',
    'difícil': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-neutral-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-neutral-900 text-sm">
            Tarjeta {currentIndex + 1} de {filteredConcepts.length}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Repetición Espaciada
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Topic Selector */}
          <select
            id="filter-topic-select"
            value={selectedTopicFilter || ''}
            onChange={(e) => setSelectedTopicFilter(e.target.value || null)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-700 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Todos los Temas</option>
            {Array.from(new Set(concepts.map(c => c.topic))).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            id="filter-difficulty-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-700 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">Todas las Dificultades</option>
            <option value="fácil">🟢 Fácil</option>
            <option value="medio">🟡 Medio</option>
            <option value="difícil">🔴 Difícil</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-purple-600 h-2 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / filteredConcepts.length) * 100}%` }}
        />
      </div>

      {/* Interactive 3D Flip Card Container */}
      <div 
        id="flashcard-interactive-container"
        onClick={() => setIsFlipped(!isFlipped)}
        className="perspective-1000 min-h-[380px] sm:min-h-[420px] cursor-pointer group"
      >
        <div className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl flex flex-col justify-between backface-hidden group-hover:border-purple-300 transition-colors">
            
            {/* Top Badges */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                {currentCard.topic}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${difficultyColors[currentCard.difficulty]}`}>
                Dificultad: {currentCard.difficulty}
              </span>
            </div>

            {/* Concept Display */}
            <div className="my-auto text-center space-y-4 px-2">
              <div className="text-5xl sm:text-6xl animate-bounce">
                {currentCard.emoji}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {currentCard.term}
              </h2>

              {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                <p className="text-xs text-neutral-400 font-medium">
                  También conocido como: {currentCard.synonyms.join(', ')}
                </p>
              )}
            </div>

            {/* Bottom Tip */}
            <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-100 pt-4">
              <span className="flex items-center gap-1 font-medium">
                <RotateCw className="w-3.5 h-3.5 text-purple-500 animate-spin-slow" />
                Haz clic o presiona Espacio para ver la definición
              </span>
              <span className="font-semibold text-purple-600">Dominio: {currentCard.masteryLevel}%</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/30 shadow-2xl flex flex-col justify-between rotate-y-180 backface-hidden">
            
            {/* Top Bar Back */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentCard.emoji}</span>
                <span className="font-bold text-white text-base tracking-tight">{currentCard.term}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="speak-audio-button"
                  onClick={handleSpeak}
                  className={`p-2 rounded-full ${isSpeaking ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-neutral-200'} transition-all`}
                  title="Escuchar explicación en voz alta"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Definition & Example */}
            <div className="space-y-4 my-auto py-2">
              <div>
                <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  💡 Definición Sencilla
                </h4>
                <p className="text-base sm:text-lg font-medium text-neutral-100 leading-relaxed">
                  "{currentCard.simpleDefinition}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ejemplo Práctico Real
                </h4>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-light">
                  {currentCard.practicalExample}
                </p>
              </div>

              {currentCard.keyTakeaway && (
                <div className="text-xs text-indigo-200/90 font-medium bg-indigo-900/40 p-2.5 rounded-xl border border-indigo-500/20">
                  📌 <strong>Idea Clave:</strong> {currentCard.keyTakeaway}
                </div>
              )}
            </div>

            {/* Bottom Flip Indicator */}
            <div className="text-center text-[11px] text-neutral-400 border-t border-white/10 pt-3">
              Voltear de nuevo o selecciona tu nivel de recuerdo abajo 👇
            </div>

          </div>

        </div>
      </div>

      {/* Navigation & Spaced Repetition Rating Controls */}
      <div className="space-y-4">
        
        {/* Next / Prev Nav Arrows */}
        <div className="flex items-center justify-between">
          <button
            id="prev-card-btn"
            onClick={handlePrev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <button
            id="flip-card-center-btn"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-sm"
          >
            <RotateCw className="w-4 h-4" />
            Voltear Tarjeta
          </button>

          <button
            id="next-card-btn"
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition shadow-sm"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Spaced Repetition Buttons */}
        <div className="p-4 rounded-3xl bg-neutral-900 text-white space-y-2 shadow-xl">
          <p className="text-center text-xs text-neutral-300 font-semibold mb-2">
            ¿Qué tan bien recordabas este concepto? (Repetición Espaciada)
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              id="rate-difficult-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRating('difficult');
              }}
              className="px-3 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition group"
            >
              <X className="w-4 h-4 text-rose-400 group-hover:scale-125 transition-transform" />
              <span>Difícil</span>
              <span className="text-[10px] text-rose-300 font-normal">Repasar mañana (1d)</span>
            </button>

            <button
              id="rate-medium-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRating('medium');
              }}
              className="px-3 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition group"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
              <span>Regular</span>
              <span className="text-[10px] text-amber-300 font-normal">Repasar en 3 días</span>
            </button>

            <button
              id="rate-easy-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRating('easy');
              }}
              className="px-3 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition group"
            >
              <Check className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              <span>¡Dominado!</span>
              <span className="text-[10px] text-emerald-300 font-normal">Repasar en 7+ días</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
