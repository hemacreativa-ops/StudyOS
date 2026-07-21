import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import confetti from 'canvas-confetti';
import { Zap, Flame, Clock, Sparkles, CheckCircle2, ArrowRight, Lightbulb, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CramModeProps {
  concepts: Concept[];
  onFinishCram: () => void;
}

export const CramMode: React.FC<CramModeProps> = ({ concepts, onFinishCram }) => {
  const [cramConcepts, setCramConcepts] = useState<Concept[]>([]);
  const [highYieldTips, setHighYieldTips] = useState<string[]>([]);
  const [mnemonics, setMnemonics] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'review' | 'speed_quiz'>('review');
  const [isLoading, setIsLoading] = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCramPlan();
  }, [concepts]);

  const fetchCramPlan = async () => {
    setIsLoading(true);

    // Pick top priority concepts (least mastered or marked as exam priority)
    const sorted = [...concepts].sort((a, b) => {
      if (a.isExamPriority && !b.isExamPriority) return -1;
      if (!a.isExamPriority && b.isExamPriority) return 1;
      return a.masteryLevel - b.masteryLevel;
    }).slice(0, 6);

    try {
      const response = await fetch('/api/generate-cram-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts: sorted }),
      });

      const data = await response.json();

      if (data.success && data.cramPlan) {
        setHighYieldTips(data.cramPlan.highYieldTips || []);

        const mnemMap: Record<string, string> = {};
        if (data.cramPlan.quickSummaryMap) {
          data.cramPlan.quickSummaryMap.forEach((item: any) => {
            mnemMap[item.conceptId] = `${item.mnemonic} - ${item.mustKnowKeypoint}`;
          });
        }
        setMnemonics(mnemMap);
      }
    } catch (e) {
      // Local fallback tips if API fails
      setHighYieldTips([
        'Enfócate en la diferencia entre LTV y CAC (la regla LTV > 3x CAC es pregunta fija de examen).',
        'Inbound Marketing atrae sin molestar; Outbound Marketing interrumpe.',
        'El Brand Equity es la razón por la que pagas más por Starbucks que por un café genérico.'
      ]);
    } finally {
      setCramConcepts(sorted);
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = (conceptId: string, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [conceptId]: answer }));
  };

  const handleSubmitCramQuiz = () => {
    let correct = 0;
    cramConcepts.forEach(c => {
      if (quizAnswers[c.id] === c.simpleDefinition) {
        correct += 1;
      }
    });

    const scorePct = Math.round((correct / cramConcepts.length) * 100);
    setQuizScore(scorePct);

    if (scorePct >= 70) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-neutral-200 shadow-xl space-y-4">
        <Zap className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
        <h3 className="text-xl font-extrabold text-neutral-900">
          Analizando tus debilidades y preparando el Plan de 15 Minutos...
        </h3>
        <p className="text-xs text-neutral-500">
          Seleccionando únicamente los conceptos clave para asegurar tu aprobado mañana.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* CRAM BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            Plan de Emergencia Intensivo (15 Minutos)
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-bold bg-black/30 px-3 py-1.5 rounded-2xl">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            ⏱️ 15m
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Modo "Tengo Examen Mañana" ⚡
        </h1>

        <p className="text-xs sm:text-sm text-red-50 font-light leading-relaxed max-w-2xl">
          Hemos filtrado los <strong>{cramConcepts.length} conceptos más probables de examen</strong> con la menor tasa de retención. Revisa estas fichas ultrarrápidas y realiza el test de comprobación express.
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/20">
          <button
            onClick={() => setActiveTab('review')}
            id="cram-tab-review"
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'review'
                ? 'bg-white text-neutral-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            1. Repaso de Alto Rendimiento ({cramConcepts.length})
          </button>

          <button
            onClick={() => setActiveTab('speed_quiz')}
            id="cram-tab-quiz"
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'speed_quiz'
                ? 'bg-white text-neutral-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            2. Test Rápido Express ⚡
          </button>
        </div>
      </div>

      {/* TAB 1: REPASO EXPRES */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          
          {/* High Yield Tips Box */}
          {highYieldTips.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Consejos Clave de Cátedra para Mañana:
              </h3>
              <ul className="space-y-2 pl-6 list-disc text-xs text-amber-950 font-medium">
                {highYieldTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Concepts Priority Cards */}
          <div className="space-y-4">
            <h3 className="font-bold text-neutral-900 text-base">Conceptos Vitales a Reforzar Hoy:</h3>

            {cramConcepts.map((concept, index) => {
              const mnemonic = mnemonics[concept.id];

              return (
                <div 
                  key={concept.id}
                  className="bg-white rounded-3xl p-6 border-2 border-neutral-200 shadow-md hover:border-amber-400 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{concept.emoji}</span>
                      <span className="font-extrabold text-neutral-900 text-base sm:text-lg">
                        {index + 1}. {concept.term}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                      Dominio Actual: {concept.masteryLevel}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      Definición Esencial
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                      "{concept.simpleDefinition}"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                    <strong className="text-neutral-900">Ejemplo Real:</strong> {concept.practicalExample}
                  </div>

                  {mnemonic && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                      🧠 <strong>Truco Mnemotécnico:</strong> {mnemonic}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveTab('speed_quiz')}
            id="proceed-to-cram-quiz-btn"
            className="w-full py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wide transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ir al Test Rápido Express</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* TAB 2: TEST RÁPIDO EXPRESS */}
      {activeTab === 'speed_quiz' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Comprobación Express de 6 Preguntas
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900 mt-2">
              Demuestra que dominas estos conceptos para tu examen
            </h3>
          </div>

          {quizScore !== null ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-3xl font-extrabold">
                <ShieldCheck className="w-8 h-8 text-amber-600" />
              </div>

              <h3 className="text-2xl font-extrabold text-neutral-900">
                Puntuación Express: {quizScore}%
              </h3>
              <p className="text-xs text-neutral-600">
                {quizScore >= 70 
                  ? '¡Excelente! Estás listo para defender estos conceptos en tu examen.' 
                  : 'Revisa de nuevo las fichas de la pestaña 1 para afianzar detalles.'}
              </p>

              <button
                onClick={onFinishCram}
                id="finish-cram-mode-btn"
                className="px-6 py-3 rounded-2xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition shadow"
              >
                Volver al Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cramConcepts.map((concept, idx) => {
                const otherDefs = concepts
                  .filter(c => c.id !== concept.id)
                  .map(c => c.simpleDefinition)
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 2);

                const options = [concept.simpleDefinition, ...otherDefs].sort(() => 0.5 - Math.random());

                return (
                  <div key={concept.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                    <p className="text-xs sm:text-sm font-extrabold text-neutral-900">
                      {idx + 1}. ¿Qué es "{concept.term}"?
                    </p>

                    <div className="space-y-2">
                      {options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[concept.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            id={`cram-q${idx}-opt-${optIdx}`}
                            onClick={() => handleQuizAnswer(concept.id, opt)}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                              isSelected
                                ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-200'
                                : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleSubmitCramQuiz}
                id="submit-cram-quiz-btn"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs tracking-wide shadow-lg hover:shadow-red-500/20 transition cursor-pointer"
              >
                Calificar Test de Emergencia
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
