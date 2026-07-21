import React, { useState, useEffect } from 'react';
import { Concept, Question } from '../types';
import confetti from 'canvas-confetti';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';

interface QuizModeProps {
  concepts: Concept[];
  onFinishQuiz: (score: number, totalQuestions: number, timeSpent: number) => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ concepts, onFinishQuiz }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  // Generate 5 questions dynamically from concepts
  const generateQuestions = () => {
    if (concepts.length === 0) return;

    const shuffled = [...concepts].sort(() => 0.5 - Math.random()).slice(0, 5);
    const qList: Question[] = shuffled.map((concept, idx) => {
      // 50% chance multiple choice, 50% true/false or fill in
      const isTrueFalse = idx % 2 === 1;

      if (isTrueFalse) {
        // Generate True/False question
        const isStatementTrue = Math.random() > 0.5;
        let statement = '';
        if (isStatementTrue) {
          statement = `El concepto de "${concept.term}" se define como: ${concept.simpleDefinition}`;
        } else {
          // borrow definition from another concept
          const fakeConcept = concepts.find(c => c.id !== concept.id) || concepts[0];
          statement = `El concepto de "${concept.term}" se refiere a: ${fakeConcept.simpleDefinition}`;
        }

        return {
          id: `q-${idx}`,
          type: 'true_false',
          conceptId: concept.id,
          conceptTerm: concept.term,
          question: statement,
          options: ['Verdadero', 'Falso'],
          correctAnswer: isStatementTrue ? 'Verdadero' : 'Falso',
          explanation: `👉 ${concept.term}: "${concept.simpleDefinition}". Ejemplo real: ${concept.practicalExample}`,
        };
      } else {
        // Multiple choice question
        const otherDefinitions = concepts
          .filter(c => c.id !== concept.id)
          .map(c => c.simpleDefinition)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        const options = [concept.simpleDefinition, ...otherDefinitions].sort(() => 0.5 - Math.random());

        return {
          id: `q-${idx}`,
          type: 'multiple_choice',
          conceptId: concept.id,
          conceptTerm: concept.term,
          question: `¿Cuál de las siguientes afirmaciones describe mejor el término "${concept.term}"?`,
          options,
          correctAnswer: concept.simpleDefinition,
          explanation: `💡 ${concept.term}: ${concept.simpleDefinition}. Ejemplo: ${concept.practicalExample}`,
        };
      }
    });

    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isSubmitted) return;

    setIsSubmitted(true);
    const correct = selectedAnswer === currentQ.correctAnswer;
    if (correct) {
      setScore(prev => prev + 1);
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    } else {
      setIsCompleted(true);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const finalScorePct = Math.round(((score + (selectedAnswer === currentQ.correctAnswer ? 1 : 0)) / questions.length) * 100);
      onFinishQuiz(finalScorePct, questions.length, durationSeconds);
    }
  };

  if (questions.length === 0 || !currentQ) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-3xl p-6 border border-neutral-200">
        <p className="text-sm font-medium text-neutral-600">Cargando cuestionario...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Quiz Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-neutral-900 text-sm">
            Mini Cuestionario • Pregunta {currentIndex + 1} de {questions.length}
          </span>
        </div>

        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          Puntos: {score}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* SUMMARY RESULT WHEN FINISHED */}
      {isCompleted ? (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
            <Award className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-neutral-900">¡Mini Cuestionario Completado!</h2>
            <p className="text-sm text-neutral-600">
              Respondiste correctamente <strong className="text-neutral-900">{score} de {questions.length}</strong> preguntas ({Math.round((score / questions.length) * 100)}%).
            </p>
          </div>

          <button
            onClick={generateQuestions}
            id="restart-quiz-btn"
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Hacer otro Mini Quiz
          </button>
        </div>
      ) : (
        /* QUESTION CARD */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl space-y-6">
          
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">
              {currentQ.type === 'true_false' ? 'Verdadero o Falso' : 'Opción Múltiple'}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options?.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              let style = 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800';

              if (isSubmitted) {
                if (opt === currentQ.correctAnswer) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                } else if (isSelected) {
                  style = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
                } else {
                  style = 'border-neutral-200 opacity-40 bg-neutral-50';
                }
              } else if (isSelected) {
                style = 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-200';
              }

              return (
                <button
                  key={i}
                  id={`quiz-opt-${i}`}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-4 rounded-2xl border-2 text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${style}`}
                >
                  <span className="leading-relaxed">{opt}</span>
                  {isSubmitted && opt === currentQ.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  {isSubmitted && isSelected && opt !== currentQ.correctAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation box after submit */}
          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Explicación Activa
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                id="submit-quiz-ans-btn"
                className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide transition shadow-md ${
                  selectedAnswer 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Comprobar Respuesta
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                id="next-quiz-q-btn"
                className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>{currentIndex + 1 === questions.length ? 'Ver Resultados' : 'Siguiente Pregunta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
