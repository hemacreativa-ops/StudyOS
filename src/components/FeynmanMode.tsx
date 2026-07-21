import React, { useState } from 'react';
import { Concept, FeynmanEvaluation } from '../types';
import confetti from 'canvas-confetti';
import { MessageSquareQuote, Sparkles, Send, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

interface FeynmanModeProps {
  concepts: Concept[];
  onConceptEvaluated: (conceptId: string, score: number) => void;
}

export const FeynmanMode: React.FC<FeynmanModeProps> = ({ concepts, onConceptEvaluated }) => {
  const [selectedConceptId, setSelectedConceptId] = useState<string>(concepts[0]?.id || '');
  const [userExplanation, setUserExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentConcept = concepts.find(c => c.id === selectedConceptId) || concepts[0];

  const handleEvaluate = async () => {
    if (!userExplanation.trim() || !currentConcept) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/evaluate-feynman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTerm: currentConcept.term,
          simpleDefinition: currentConcept.simpleDefinition,
          practicalExample: currentConcept.practicalExample,
          userExplanation,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al evaluar con la IA');
      }

      setEvaluation(data.evaluation);
      onConceptEvaluated(currentConcept.id, data.evaluation.score);

      if (data.evaluation.score >= 80) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      console.error('Feynman evaluation error:', err);
      setErrorMsg(err.message || 'Ocurrió un problema conectando con el evaluador de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEvaluation(null);
    setUserExplanation('');
    setErrorMsg(null);
  };

  if (!currentConcept) {
    return <div className="p-8 text-center text-neutral-500">No hay conceptos disponibles.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Mode Title & Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
            🗣️
          </div>
          <div>
            <h2 className="font-extrabold text-neutral-900 text-lg">Técnica Feynman: Explícalo con tus Palabras</h2>
            <p className="text-xs text-neutral-500">
              Si no puedes explicarlo de forma sencilla, no lo has entendido lo suficiente. Escribe tu explicación y la IA evaluará tu comprensión real.
            </p>
          </div>
        </div>

        {/* Concept Selector Dropdown */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
            Elige un concepto:
          </label>
          <select
            id="feynman-concept-select"
            value={selectedConceptId}
            onChange={(e) => {
              setSelectedConceptId(e.target.value);
              handleReset();
            }}
            className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-900 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {concepts.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.term} ({c.topic})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONCEPT CHALLENGE CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl space-y-6">
        
        {/* Target Term Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-rose-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full">
              {currentConcept.topic}
            </span>
            <span className="text-2xl">{currentConcept.emoji}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
            {currentConcept.term}
          </h3>
          <p className="text-xs text-neutral-600 italic">
            Consigna: Escribe abajo cómo le explicarías este concepto a un compañero de clase o a alguien sin conocimientos de marketing.
          </p>
        </div>

        {/* Text Area Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
            <span>Tu explicación en tus propias palabras:</span>
            <span className="text-[11px] font-normal text-neutral-400">{userExplanation.length} caracteres</span>
          </label>
          <textarea
            id="feynman-explanation-input"
            rows={5}
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            disabled={isLoading || !!evaluation}
            placeholder="Ejemplo: 'Este concepto significa básicamente que... Un caso real en una empresa sería cuando...'"
            className="w-full p-4 rounded-2xl border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-neutral-50 transition"
          />
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Button */}
        {!evaluation ? (
          <button
            onClick={handleEvaluate}
            disabled={isLoading || !userExplanation.trim()}
            id="submit-feynman-btn"
            className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
              userExplanation.trim() && !isLoading
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-rose-200'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analizando tu explicación con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Evaluar Comprensión con IA</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleReset}
            id="try-again-feynman-btn"
            className="w-full py-3 rounded-2xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Explicar otro concepto
          </button>
        )}
      </div>

      {/* EVALUATION RESULTS CARD */}
      {evaluation && (
        <div id="feynman-results-card" className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Resultado Feynman</span>
              <h3 className="text-lg font-extrabold text-neutral-900">Evaluación de Inteligencia Artificial</h3>
            </div>

            {/* Score Ring / Pill */}
            <div className={`px-4 py-2 rounded-2xl font-extrabold text-base flex items-center gap-1.5 ${
              evaluation.score >= 80 
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                : evaluation.score >= 60 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              <span>Score:</span>
              <span className="text-xl">{evaluation.score}</span>
              <span>/100</span>
            </div>
          </div>

          {/* Feedback message */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
            "{evaluation.feedback}"
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Puntos Fuertes Comprendidos:
            </h4>
            <ul className="space-y-1.5 pl-6 list-disc text-xs text-neutral-700">
              {evaluation.strengths.map((str, i) => (
                <li key={i}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Missing details */}
          {evaluation.missingConcepts && evaluation.missingConcepts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Matices a reforzar:
              </h4>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-neutral-700">
                {evaluation.missingConcepts.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved version */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              Versión Explicativa Modelo (Para Examen):
            </h4>
            <p className="text-xs text-indigo-950 leading-relaxed font-medium">
              "{evaluation.improvedVersion}"
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
