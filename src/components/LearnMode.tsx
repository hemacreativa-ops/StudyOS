import React, { useState } from 'react';
import { Concept } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Sparkles, Trophy } from 'lucide-react';

interface LearnModeProps {
  concepts: Concept[];
  onConceptLearned: (conceptId: string, isCorrect: boolean) => void;
  onFinishLesson: () => void;
}

export const LearnMode: React.FC<LearnModeProps> = ({
  concepts,
  onConceptLearned,
  onFinishLesson,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<'study' | 'quiz'>('study');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const currentConcept = concepts[currentIndex];

  if (!currentConcept || currentIndex >= concepts.length) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white rounded-3xl border border-neutral-200 shadow-xl space-y-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900">¡Lección Completada! 🎉</h2>
          <p className="text-sm text-neutral-600">
            Has completado el bloque de aprendizaje activo para {completedCount} conceptos de Marketing.
          </p>
        </div>
        <button
          onClick={onFinishLesson}
          id="finish-learn-btn"
          className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Generate 3 distractors for the comprehension check
  const otherConcepts = concepts.filter(c => c.id !== currentConcept.id);
  const distractors = otherConcepts
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(c => c.simpleDefinition);

  // Shuffle options
  const options = React.useMemo(() => {
    const all = [currentConcept.simpleDefinition, ...distractors];
    return all.sort(() => 0.5 - Math.random());
  }, [currentConcept.id]);

  const handleCheckAnswer = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
    setIsAnswerSubmitted(true);

    const correct = option === currentConcept.simpleDefinition;
    setIsCorrect(correct);

    if (correct) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
      setCompletedCount(prev => prev + 1);
    }

    onConceptLearned(currentConcept.id, correct);
  };

  const handleNextStep = () => {
    if (step === 'study') {
      setStep('quiz');
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setStep('study');
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-neutral-900 text-sm">
            Modo Aprender • {currentIndex + 1} de {concepts.length}
          </span>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
          Etapa: {step === 'study' ? '1. Mapeo Conceptual' : '2. Comprobación Activa'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 0.5) / concepts.length) * 100}%` }}
        />
      </div>

      {/* STEP 1: CONCEPT PRESENTATION */}
      {step === 'study' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
              {currentConcept.topic}
            </span>
            <span className="text-2xl">{currentConcept.emoji}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {currentConcept.term}
            </h2>
            <p className="text-base text-neutral-700 leading-relaxed font-medium">
              "{currentConcept.simpleDefinition}"
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Ejemplo Práctico de Empresa
            </div>
            <p className="text-xs sm:text-sm text-indigo-950 font-normal leading-relaxed">
              {currentConcept.practicalExample}
            </p>
          </div>

          {currentConcept.keyTakeaway && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              💡 <strong>Regla para el Examen:</strong> {currentConcept.keyTakeaway}
            </div>
          )}

          <button
            onClick={handleNextStep}
            id="continue-to-quiz-btn"
            className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 group"
          >
            <span>Pon a prueba tu comprensión</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* STEP 2: ACTIVE COMPREHENSION CHECK */}
      {step === 'quiz' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Comprobación de Recuerdo Activo
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 mt-3">
              ¿Cuál de las siguientes es la definición correcta para <span className="text-indigo-600">"{currentConcept.term}"</span>?
            </h3>
          </div>

          <div className="space-y-3">
            {options.map((opt, i) => {
              let btnStyle = 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800';

              if (isAnswerSubmitted) {
                if (opt === currentConcept.simpleDefinition) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                } else if (opt === selectedOption) {
                  btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold';
                } else {
                  btnStyle = 'border-neutral-200 opacity-50 bg-neutral-50';
                }
              }

              return (
                <button
                  key={i}
                  id={`learn-opt-${i}`}
                  onClick={() => handleCheckAnswer(opt)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-4 rounded-2xl border-2 text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${btnStyle}`}
                >
                  <span className="leading-relaxed">{opt}</span>
                  {isAnswerSubmitted && opt === currentConcept.simpleDefinition && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  {isAnswerSubmitted && opt === selectedOption && opt !== currentConcept.simpleDefinition && (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Continue */}
          {isAnswerSubmitted && (
            <div className={`p-4 rounded-2xl space-y-3 ${isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ¡Correcto! Entiendes el concepto claramente.
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    Casi. Recuerda repasar la definición de arriba.
                  </>
                )}
              </div>

              <p className="text-xs leading-relaxed">
                <strong>Ejemplo asociativo:</strong> {currentConcept.practicalExample}
              </p>

              <button
                onClick={handleNextStep}
                id="next-concept-btn"
                className="w-full py-3 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2"
              >
                <span>Siguiente Concepto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
