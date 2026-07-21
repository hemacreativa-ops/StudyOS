import React from 'react';
import { Concept, UserStats, ActiveTab } from '../types';
import { TOPIC_GROUPS } from '../data/defaultConcepts';
import { 
  Clock, 
  Flame, 
  CheckCircle, 
  HelpCircle, 
  Zap, 
  BookOpen, 
  CreditCard, 
  Grid2X2, 
  MessageSquareQuote, 
  GraduationCap, 
  ArrowRight, 
  Upload,
  BarChart,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  concepts: Concept[];
  stats: UserStats;
  onSetStudyGoal: (minutes: 10 | 20 | 30 | 60) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPdfModal: () => void;
  onSelectTopic: (topicName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  concepts,
  stats,
  onSetStudyGoal,
  setActiveTab,
  onOpenPdfModal,
  onSelectTopic,
}) => {
  const total = concepts.length;
  const mastered = concepts.filter(c => c.masteryLevel >= 80).length;
  const reviewNeeded = concepts.filter(c => {
    if (!c.nextReviewDate) return true;
    return new Date(c.nextReviewDate) <= new Date() || c.masteryLevel < 80;
  }).length;
  const pending = total - mastered;

  const overallMasteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const timeOptions: (10 | 20 | 30 | 60)[] = [10, 20, 30, 60];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner (Geometric Balance Theme) */}
      <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm bg-grid-pattern">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Estudio Inteligente de Marketing & Negocios Digitales
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Hola, Universitario 👋 <br />
            <span className="text-indigo-200">
              Comprende conceptos rápido sin memorizar textos largos.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed">
            Aprende activamente con repetición espaciada, mapas mentales, minijuegos y simulacros creados para tu carrera.
          </p>

          {/* Time Selector */}
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              ¿Cuánto tiempo tienes para estudiar hoy?
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {timeOptions.map((mins) => (
                <button
                  key={mins}
                  id={`goal-btn-${mins}`}
                  onClick={() => onSetStudyGoal(mins)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stats.dailyGoalMinutes === mins
                      ? 'bg-white text-neutral-900 border border-white shadow-xs scale-102'
                      : 'bg-neutral-800/80 text-neutral-200 hover:bg-neutral-800 border border-neutral-700'
                  }`}
                >
                  <span>⏱️ {mins} Minutos</span>
                  {stats.dailyGoalMinutes === mins && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Quick Action for Emergency Cram Mode */}
        <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-2xl shadow-xs">
              🔥
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Modo "Tengo Examen Mañana"</h3>
              <p className="text-xs text-neutral-300">
                Plan intensivo de 15 minutos enfocado ÚNICAMENTE en conceptos clave a reforzar.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cram')}
            id="launch-cram-mode-btn"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Iniciar Plan 15 Min</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Overview Stats Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Mastery Ring */}
        <div id="widget-mastery" className="p-5 rounded-xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dominio General</span>
            <BarChart className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-neutral-900">{overallMasteryPct}%</span>
            <span className="text-xs text-emerald-600 font-bold">↑ {mastered} de {total}</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200/50">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${overallMasteryPct}%` }}
            />
          </div>
        </div>

        {/* Mastered Concepts */}
        <div id="widget-mastered" className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Dominados</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-950">{mastered}</span>
            <p className="text-xs text-emerald-700 font-medium">Conceptos con &gt;80% retención</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">Comprendidos con éxito</span>
        </div>

        {/* Pending & To Review */}
        <div id="widget-pending" className="p-5 rounded-xl bg-amber-50/50 border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider">Pendientes / Repaso</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-amber-950">{reviewNeeded}</span>
            <p className="text-xs text-amber-800 font-medium">{pending} por dominar por completo</p>
          </div>
          <span className="text-[11px] font-bold text-amber-700">Programados para repaso hoy</span>
        </div>

        {/* Streak & Time */}
        <div id="widget-streak" className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-xs font-bold uppercase tracking-wider">Racha Activa</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-indigo-950">{stats.streakDays} Días</span>
            <p className="text-xs text-indigo-800 font-medium">{stats.totalStudyMinutes} mins totales estudiados</p>
          </div>
          <span className="text-[11px] font-bold text-indigo-700">¡Sigue con el hábito diario!</span>
        </div>
      </div>

      {/* Section: Study Modes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Modos de Aprendizaje Activo</h2>
            <p className="text-xs text-neutral-500">Selecciona una técnica interactiva para ejercitar la memoria y comprensión</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Mode 1: Aprender */}
          <div 
            onClick={() => setActiveTab('learn')}
            id="mode-card-learn"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                📖
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Paso a Paso
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-indigo-600 transition-colors">
                1. Modo Aprender
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Ruta guiada de conceptos breves con comprobaciones inmediatas para fijar conocimientos.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-indigo-600 gap-1 pt-2">
              <span>Comenzar lección</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 2: Flashcards */}
          <div 
            onClick={() => setActiveTab('flashcards')}
            id="mode-card-flashcards"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                🎴
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                Repetición Espaciada
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-purple-600 transition-colors">
                2. Flashcards Inteligentes
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Tarjetas interactivas con concepto, definición simple, ejemplo real y nivel de dificultad.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-purple-600 gap-1 pt-2">
              <span>Voltear tarjetas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 3: Asociación */}
          <div 
            onClick={() => setActiveTab('matching')}
            id="mode-card-matching"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                🧩
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Juego Contrarreloj
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-amber-600 transition-colors">
                3. Asociación de Conceptos
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Relaciona términos con sus definiciones y ejemplos prácticos rápidamente antes de que se agote el tiempo.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-600 gap-1 pt-2">
              <span>Jugar ahora</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 4: Mini Cuestionarios */}
          <div 
            onClick={() => setActiveTab('quiz')}
            id="mode-card-quiz"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                ❓
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                5 Preguntas
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-emerald-600 transition-colors">
                4. Mini Cuestionarios
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Ejercicios rápidos de opción múltiple, verdadero o falso y completar espacio para medir tu retención.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-600 gap-1 pt-2">
              <span>Iniciar test rápido</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 5: Explicar con tus palabras (Feynman) */}
          <div 
            onClick={() => setActiveTab('feynman')}
            id="mode-card-feynman"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                🗣️
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                Técnica Feynman con IA
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-rose-600 transition-colors">
                5. Explicar con tus palabras
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Escribe la explicación en tu propio lenguaje. La IA evaluará tu comprensión real y detectará lagunas.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-rose-600 gap-1 pt-2">
              <span>Probar método Feynman</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 6: Examen Final */}
          <div 
            onClick={() => setActiveTab('exam')}
            id="mode-card-exam"
            className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                🎓
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                Simulacro Real
              </span>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base group-hover:text-blue-600 transition-colors">
                6. Examen Final Completo
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Simulacro integral con preguntas aleatorias, temporizador de examen universitario y calificación.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-blue-600 gap-1 pt-2">
              <span>Simular examen</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Section: Topic Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Grandes Temas del Programa</h2>
            <p className="text-xs text-neutral-500">Conceptos agrupados de Marketing y Negocios Digitales</p>
          </div>
          <button 
            onClick={onOpenPdfModal}
            id="add-custom-pdf-btn"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            + Cargar PDF / Apuntes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPIC_GROUPS.map((group) => {
            const topicConcepts = concepts.filter(c => c.topic === group.name);
            const topicTotal = topicConcepts.length;
            const topicMastered = topicConcepts.filter(c => c.masteryLevel >= 80).length;
            const pct = topicTotal > 0 ? Math.round((topicMastered / topicTotal) * 100) : 0;

            return (
              <div 
                key={group.id}
                id={`topic-card-${group.id}`}
                onClick={() => {
                  onSelectTopic(group.name);
                  setActiveTab('flashcards');
                }}
                className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{group.icon}</span>
                  <span className="text-xs font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md">
                    {topicTotal} conceptos
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-neutral-500">Progreso</span>
                    <span className="text-neutral-900">{pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/50">
                    <div 
                      className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
