import React from 'react';
import { ActiveTab, UserStats } from '../types';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Upload, 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  Grid2X2, 
  HelpCircle, 
  MessageSquareQuote, 
  GraduationCap, 
  Zap, 
  BarChart3,
  ListFilter
} from 'lucide-react';

interface HeaderNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: UserStats;
  onOpenPdfModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenPdfModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-xs transition-all">
      {/* Top Status & Gamification Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
            id="logo-button"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold text-xl shadow-sm border border-neutral-800 group-hover:scale-105 transition-transform">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-neutral-900 text-lg tracking-tight">StudioMkt</span>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Universidad
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                Aprendizaje Activo & Negocios Digitales
              </p>
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Streak Counter */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-bold"
              title="Días seguidos estudiando"
              id="streak-badge"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{stats.streakDays} Racha</span>
            </div>

            {/* Today Study Time Goal */}
            <div 
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-bold"
              title="Tiempo estudiado hoy / Meta diaria"
              id="study-time-badge"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{stats.todayStudyMinutes}m / {stats.dailyGoalMinutes}m</span>
            </div>

            {/* Mastered Concepts */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-bold"
              title="Conceptos dominados"
              id="mastered-concepts-badge"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{stats.masteredCount} Dominados</span>
            </div>

            {/* Action: Import PDF / Notes */}
            <button
              onClick={onOpenPdfModal}
              id="header-import-pdf-button"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-all border border-neutral-900 active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cargar PDF / Apuntes</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Secondary Mode Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-neutral-100">
          <button
            onClick={() => setActiveTab('dashboard')}
            id="tab-dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-neutral-900 text-white border border-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            id="tab-learn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            1. Aprender
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            id="tab-flashcards"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-purple-600 text-white border border-purple-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            2. Flashcards
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            id="tab-matching"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matching'
                ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            3. Asociación
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            id="tab-quiz"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            4. Mini Quiz
          </button>

          <button
            onClick={() => setActiveTab('feynman')}
            id="tab-feynman"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'feynman'
                ? 'bg-rose-600 text-white border border-rose-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            5. Método Feynman
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            id="tab-exam"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'exam'
                ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            6. Examen Final
          </button>

          <div className="h-4 w-px bg-neutral-200 mx-1 flex-shrink-0" />

          <button
            onClick={() => setActiveTab('cram')}
            id="tab-cram"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cram'
                ? 'bg-red-600 text-white border border-red-600 shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            ⚡ Examen Mañana (15m)
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            id="tab-concepts"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-neutral-900 text-white border border-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Glosario
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            id="tab-progress"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-neutral-900 text-white border border-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Progreso
          </button>
        </div>
      </div>
    </header>
  );
};
