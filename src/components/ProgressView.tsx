import React, { useState } from 'react';
import { Concept, UserStats, ExamResult } from '../types';
import { TOPIC_GROUPS } from '../data/defaultConcepts';
import { BarChart3, CheckCircle2, Clock, Trophy, Flame, Database, Search, ArrowUpRight, Award } from 'lucide-react';

interface ProgressViewProps {
  concepts: Concept[];
  stats: UserStats;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ concepts, stats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mastered' | 'pending' | 'exams'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const masteredList = concepts.filter(c => c.masteryLevel >= 80);
  const pendingList = concepts.filter(c => c.masteryLevel < 80);

  const filteredMastered = masteredList.filter(c => 
    c.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingList.filter(c => 
    c.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Title & Cloud Sync Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Sistema de Progreso & Analítica</h2>
          <p className="text-xs text-neutral-500">Métricas en tiempo real de tu retención conceptual e historial de exámenes</p>
        </div>

        {/* Supabase Persistence Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sincronizado en Supabase Cloud</span>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase">Tiempo Estudiado</div>
          <div className="text-2xl font-black text-neutral-900">{stats.totalStudyMinutes} mins</div>
          <p className="text-[11px] text-emerald-600 font-bold">⏱️ Log acumulado</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase">Racha de Estudio</div>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1">
            <Flame className="w-5 h-5 fill-amber-500" />
            {stats.streakDays} días
          </div>
          <p className="text-[11px] text-neutral-500">Hábito activo</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase">Dominados</div>
          <div className="text-2xl font-black text-emerald-600">{masteredList.length}</div>
          <p className="text-[11px] text-neutral-500">Retención &gt; 80%</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase">Pendientes</div>
          <div className="text-2xl font-black text-rose-600">{pendingList.length}</div>
          <p className="text-[11px] text-neutral-500">Por reforzar</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          id="progress-tab-overview"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-neutral-900 text-white shadow'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Dominio por Tema
        </button>

        <button
          onClick={() => setActiveTab('mastered')}
          id="progress-tab-mastered"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'mastered'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Conceptos Dominados ({masteredList.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          id="progress-tab-pending"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Conceptos Pendientes ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          id="progress-tab-exams"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'exams'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Historial Exámenes ({stats.examHistory.length})
        </button>
      </div>

      {/* TAB 1: DOMINIO POR TEMA */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="font-bold text-neutral-900 text-base">Porcentaje de Dominio por Asignatura</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOPIC_GROUPS.map((group) => {
              const topicConcepts = concepts.filter(c => c.topic === group.name);
              const total = topicConcepts.length;
              const mastered = topicConcepts.filter(c => c.masteryLevel >= 80).length;
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

              return (
                <div key={group.id} className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{group.icon}</span>
                    <span className="text-xs font-extrabold text-neutral-900">{pct}%</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">{group.name}</h4>
                    <p className="text-xs text-neutral-500">{mastered} de {total} conceptos dominados</p>
                  </div>

                  <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-neutral-900 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2 & 3: CONCEPT LISTS (MASTERED OR PENDING) */}
      {(activeTab === 'mastered' || activeTab === 'pending') && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
            <input
              type="text"
              id="search-concepts-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto o tema..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          <div className="space-y-3">
            {(activeTab === 'mastered' ? filteredMastered : filteredPending).map((concept) => (
              <div 
                key={concept.id}
                className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{concept.emoji}</span>
                    <span className="font-extrabold text-neutral-900 text-sm">{concept.term}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                      {concept.topic}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2">{concept.simpleDefinition}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    concept.masteryLevel >= 80 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {concept.masteryLevel}% Dominio
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: HISTORIAL DE EXÁMENES */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <h3 className="font-bold text-neutral-900 text-base">Registro de Simulacros y Tests</h3>

          <div className="space-y-3">
            {stats.examHistory.map((exam) => (
              <div key={exam.id} className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                    exam.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <Award className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-sm">{exam.title}</h4>
                    <p className="text-xs text-neutral-500">
                      {exam.date} • {exam.correctAnswers}/{exam.totalQuestions} acertadas en {exam.timeSpentSeconds}s
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-black ${exam.score >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {exam.score}%
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Puntuación</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
