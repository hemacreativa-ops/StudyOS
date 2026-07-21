import React, { useState, useEffect } from 'react';
import { Concept, Question, ExamResult } from '../types';
import confetti from 'canvas-confetti';
import { GraduationCap, Timer, CheckCircle2, XCircle, Award, RotateCcw, AlertCircle, ArrowRight } from 'lucide-react';

interface ExamModeProps {
  concepts: Concept[];
  onCompleteExam: (result: ExamResult) => void;
}

export const ExamMode: React.FC<ExamModeProps> = ({ concepts, onCompleteExam }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isExamActive, setIsExamActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(600); // 10 min
  const [isLoading, setIsLoading] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Generate exam questions via AI API or local fallback
  const startNewExam = async () => {
    setIsLoading(true);
    setIsSubmitted(false);
    setUserAnswers({});
    setTimeRemainingSeconds(600);
    setExamResult(null);

    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts, questionCount: 8 }),
      });

      const data = await response.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error('Fallback to client generator');
      }
    } catch (e) {
      // Local fallback exam generator if API is offline
      const fallbackQuestions: Question[] = concepts.slice(0, 8).map((c, i) => {
        const otherConcepts = concepts.filter(other => other.id !== c.id);
        const options = [
          c.simpleDefinition,
          ...otherConcepts.slice(0, 3).map(o => o.simpleDefinition)
        ].sort(() => 0.5 - Math.random());

        return {
          id: `q-fallback-${i}`,
          type: i % 2 === 0 ? 'multiple_choice' : 'true_false',
          conceptId: c.id,
          conceptTerm: c.term,
          question: i % 2 === 0 
            ? `¿Cuál es el significado del concepto "${c.term}"?`
            : `Verdadero o Falso: El término "${c.term}" se ejemplifica con: ${c.practicalExample}`,
          options: i % 2 === 0 ? options : ['Verdadero', 'Falso'],
          correctAnswer: i % 2 === 0 ? c.simpleDefinition : 'Verdadero',
          explanation: `💡 ${c.term}: ${c.simpleDefinition}. Ejemplo: ${c.practicalExample}`,
        };
      });
      setQuestions(fallbackQuestions);
    } finally {
      setIsLoading(false);
      setIsExamActive(true);
    }
  };

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isExamActive && !isSubmitted && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            handleSubmitExam(); // Auto submit on timer end
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isExamActive, isSubmitted, timeRemainingSeconds]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitExam = () => {
    if (isSubmitted || questions.length === 0) return;

    let correctCount = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const timeSpent = 600 - timeRemainingSeconds;

    const result: ExamResult = {
      id: `exam-${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      title: 'Simulacro Examen Final de Marketing',
      score: scorePct,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      timeSpentSeconds: timeSpent,
      mode: 'final',
    };

    setExamResult(result);
    setIsSubmitted(true);
    setIsExamActive(false);
    onCompleteExam(result);

    if (scorePct >= 70) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            🎓
          </div>
          <div>
            <h2 className="font-extrabold text-neutral-900 text-base">Simulacro de Examen Final</h2>
            <p className="text-xs text-neutral-500">Evaluación integral con preguntas aleatorias e historia de notas</p>
          </div>
        </div>

        {isExamActive && !isSubmitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-900 text-white font-mono font-bold text-xs shadow">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>Tiempo: {Math.floor(timeRemainingSeconds / 60)}:{(timeRemainingSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* START SCREEN */}
      {!isExamActive && !isSubmitted && (
        <div className="bg-white rounded-3xl p-8 border-2 border-neutral-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
            📋
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-neutral-900">¿Listo para simular tu examen?</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Recibirás un conjunto de 8 preguntas mixtas de Opción Múltiple, Verdadero/Falso y Casos Prácticos. Tienes 10 minutos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 max-w-md mx-auto text-left space-y-2">
            <div className="font-bold text-neutral-900">Reglas del Simulacro:</div>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>El tiempo corre de forma continua.</li>
              <li>Todas las preguntas valen la misma puntuación.</li>
              <li>Al finalizar recibirás el desglose y retroalimentación para cada fallo.</li>
            </ul>
          </div>

          <button
            onClick={startNewExam}
            disabled={isLoading}
            id="start-exam-btn"
            className="w-full sm:w-80 mx-auto py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Generando preguntas con IA...' : 'Comenzar Simulacro de Examen'}
          </button>
        </div>
      )}

      {/* ACTIVE EXAM QUESTIONS LIST */}
      {isExamActive && (
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                  Pregunta {qIndex + 1} de {questions.length}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {q.type === 'true_false' ? 'Verdadero o Falso' : 'Opción Múltiple'}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug">
                {q.question}
              </h3>

              <div className="space-y-2 pt-2">
                {q.options?.map((opt, optIdx) => {
                  const isSelected = userAnswers[q.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      id={`exam-q${qIndex}-opt-${optIdx}`}
                      onClick={() => handleSelectAnswer(q.id, opt)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs sm:text-sm transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-200' 
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Exam Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmitExam}
              id="finish-submit-exam-btn"
              className="w-full py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm tracking-wide transition shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entregar y Calificar Examen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EXAM POST-SUBMISSION RESULTS */}
      {isSubmitted && examResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border-2 border-neutral-200 shadow-2xl text-center space-y-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner ${
              examResult.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Resultado Oficial</span>
              <h2 className="text-3xl font-extrabold text-neutral-900">
                {examResult.score >= 70 ? '¡Examen Aprobado! 🏆' : 'Necesita Refuerzo 📖'}
              </h2>
              <p className="text-4xl font-black text-indigo-600 my-2">
                {examResult.score}%
              </p>
              <p className="text-xs text-neutral-500">
                Respondiste correctamente {examResult.correctAnswers} de {examResult.totalQuestions} preguntas en {examResult.timeSpentSeconds} segundos.
              </p>
            </div>

            <button
              onClick={startNewExam}
              id="retake-exam-btn"
              className="px-6 py-3 rounded-2xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition shadow inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Realizar otro examen
            </button>
          </div>

          {/* Detailed Question Breakdown Review */}
          <div className="space-y-4">
            <h3 className="font-bold text-neutral-900 text-base">Revisión Detallada de Respuestas:</h3>
            
            {questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswer;

              return (
                <div key={q.id} className={`p-5 rounded-3xl border-2 space-y-3 ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600">Pregunta {idx + 1}</span>
                    {isCorrect ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correcta
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrecta
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-extrabold text-neutral-900">{q.question}</p>

                  <div className="text-xs space-y-1">
                    <p className="text-neutral-700">
                      <strong>Tu respuesta:</strong> {userAns || 'Sin responder'}
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-800 font-bold">
                        <strong>Respuesta correcta:</strong> {q.correctAnswer}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-white/80 border border-neutral-200 text-xs text-neutral-700 leading-relaxed">
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
