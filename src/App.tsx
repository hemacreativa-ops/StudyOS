import React, { useState, useEffect } from 'react';
import { ActiveTab, Concept, UserStats, ExamResult } from './types';
import { 
  getStoredConcepts, 
  saveStoredConcepts, 
  getStoredStats, 
  saveStoredStats, 
  updateSpacedRepetition 
} from './lib/storage';

import { HeaderNav } from './components/HeaderNav';
import { Dashboard } from './components/Dashboard';
import { FlashcardsView } from './components/FlashcardsView';
import { LearnMode } from './components/LearnMode';
import { MatchingGame } from './components/MatchingGame';
import { QuizMode } from './components/QuizMode';
import { FeynmanMode } from './components/FeynmanMode';
import { ExamMode } from './components/ExamMode';
import { CramMode } from './components/CramMode';
import { ProgressView } from './components/ProgressView';
import { ConceptManager } from './components/ConceptManager';
import { PdfImportModal } from './components/PdfImportModal';

export default function App() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [stats, setStats] = useState<UserStats>(getStoredStats());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Initialize concepts and stats
  useEffect(() => {
    const stored = getStoredConcepts();
    setConcepts(stored);
    const userStats = getStoredStats();
    setStats(userStats);
  }, []);

  // Update study time goal
  const handleSetStudyGoal = (minutes: 10 | 20 | 30 | 60) => {
    const updatedStats = { ...stats, dailyGoalMinutes: minutes };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Spaced repetition flashcard rating
  const handleRateConcept = (conceptId: string, rating: 'difficult' | 'medium' | 'easy') => {
    const isCorrect = rating !== 'difficult';
    const updatedConcepts = updateSpacedRepetition(conceptId, isCorrect, concepts);
    setConcepts(updatedConcepts);

    // Update study time stats (+1 min per flashcard)
    const updatedStats: UserStats = {
      ...stats,
      todayStudyMinutes: stats.todayStudyMinutes + 1,
      totalStudyMinutes: stats.totalStudyMinutes + 1,
      masteredCount: updatedConcepts.filter(c => c.masteryLevel >= 80).length,
    };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Learning pathway concept answered
  const handleConceptLearned = (conceptId: string, isCorrect: boolean) => {
    const updatedConcepts = updateSpacedRepetition(conceptId, isCorrect, concepts);
    setConcepts(updatedConcepts);
  };

  // Exam completion
  const handleCompleteExam = (result: ExamResult) => {
    const updatedHistory = [result, ...stats.examHistory];
    const minutesSpent = Math.ceil(result.timeSpentSeconds / 60);

    const updatedStats: UserStats = {
      ...stats,
      examHistory: updatedHistory,
      todayStudyMinutes: stats.todayStudyMinutes + minutesSpent,
      totalStudyMinutes: stats.totalStudyMinutes + minutesSpent,
    };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Mini quiz completion
  const handleFinishQuiz = (score: number, totalQuestions: number, timeSpent: number) => {
    const minutes = Math.ceil(timeSpent / 60);
    const result: ExamResult = {
      id: `quiz-${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      title: 'Mini Cuestionario de Repaso',
      score,
      totalQuestions,
      correctAnswers: Math.round((score / 100) * totalQuestions),
      timeSpentSeconds: timeSpent,
      mode: 'mini',
    };

    const updatedHistory = [result, ...stats.examHistory];
    const updatedStats: UserStats = {
      ...stats,
      examHistory: updatedHistory,
      todayStudyMinutes: stats.todayStudyMinutes + minutes,
      totalStudyMinutes: stats.totalStudyMinutes + minutes,
    };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Import new concepts from PDF / AI
  const handleImportConcepts = (newConcepts: Concept[]) => {
    const currentStored = getStoredConcepts();
    const existingTerms = new Set(currentStored.map(c => c.term.trim().toLowerCase()));
    
    // Filter out duplicates if term already exists
    const freshNewConcepts = newConcepts.filter(c => !existingTerms.has(c.term.trim().toLowerCase()));
    
    // Combined list: new concepts first + all existing concepts
    const combined = [...freshNewConcepts, ...currentStored];

    // Save to mkt_study_concepts_v1 & update state
    saveStoredConcepts(combined);
    setConcepts(combined);

    // Update stats total count
    const currentStats = getStoredStats();
    const updatedStats: UserStats = {
      ...currentStats,
      totalConceptsCount: combined.length,
    };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Add single manual concept
  const handleAddManualConcept = (concept: Concept) => {
    const currentStored = getStoredConcepts();
    const updated = [concept, ...currentStored.filter(c => c.term.trim().toLowerCase() !== concept.term.trim().toLowerCase())];
    
    saveStoredConcepts(updated);
    setConcepts(updated);

    const currentStats = getStoredStats();
    const updatedStats: UserStats = {
      ...currentStats,
      totalConceptsCount: updated.length,
    };
    setStats(updatedStats);
    saveStoredStats(updatedStats);
  };

  // Concept evaluated via Feynman AI
  const handleConceptEvaluated = (conceptId: string, score: number) => {
    const isCorrect = score >= 70;
    const updatedConcepts = updateSpacedRepetition(conceptId, isCorrect, concepts);
    setConcepts(updatedConcepts);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* Top Header Navigation Bar */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            concepts={concepts}
            stats={stats}
            onSetStudyGoal={handleSetStudyGoal}
            setActiveTab={setActiveTab}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
            onSelectTopic={(topic) => setSelectedTopicFilter(topic)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnMode
            concepts={concepts}
            onConceptLearned={handleConceptLearned}
            onFinishLesson={() => setActiveTab('dashboard')}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            concepts={concepts}
            selectedTopicFilter={selectedTopicFilter}
            setSelectedTopicFilter={setSelectedTopicFilter}
            onRateConcept={handleRateConcept}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'matching' && (
          <MatchingGame
            concepts={concepts}
            onFinishMatching={() => {}}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizMode
            concepts={concepts}
            onFinishQuiz={handleFinishQuiz}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'feynman' && (
          <FeynmanMode
            concepts={concepts}
            onConceptEvaluated={handleConceptEvaluated}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'exam' && (
          <ExamMode
            concepts={concepts}
            onCompleteExam={handleCompleteExam}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'cram' && (
          <CramMode
            concepts={concepts}
            onFinishCram={() => setActiveTab('dashboard')}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onOpenGenerateConcepts={() => setIsPdfModalOpen(true)}
            onStartMiniQuiz={() => setActiveTab('quiz')}
            onStartExam={() => setActiveTab('exam')}
          />
        )}

        {activeTab === 'concepts' && (
          <ConceptManager
            concepts={concepts}
            onAddConcept={handleAddManualConcept}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            concepts={concepts}
            stats={stats}
          />
        )}
      </main>

      {/* PDF Import Modal */}
      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        existingConcepts={concepts}
        onImportConcepts={handleImportConcepts}
      />

    </div>
  );
}
