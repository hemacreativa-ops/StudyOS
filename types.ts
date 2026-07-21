export type Difficulty = 'fácil' | 'medio' | 'difícil';

export interface Concept {
  id: string;
  topic: string; // e.g. 'Fundamentos de Marketing', 'Marketing Digital', 'Estrategia y Precios'
  term: string;
  simpleDefinition: string;
  practicalExample: string;
  emoji: string;
  difficulty: Difficulty;
  synonyms?: string[]; // list of equivalent or duplicate terms detected
  masteryLevel: number; // 0 to 100%
  lastReviewed: string | null; // ISO Date string
  nextReviewDate: string | null; // ISO Date string for Spaced Repetition
  reviewIntervalDays: number; // 1, 3, 7, 14, 30
  timesCorrect: number; // number of times answered right
  timesIncorrect: number; // number of times answered wrong
  isExamPriority?: boolean; // flag for "Tengo examen mañana" mode
  keyTakeaway?: string; // One sentence quick summary
}

export interface TopicGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ExamResult {
  id: string;
  date: string; // ISO date or formatted
  title: string;
  score: number; // percentage e.g. 85
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  mode: 'mini' | 'final' | 'cram';
  topicBreakdown?: Record<string, number>;
}

export interface UserStats {
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  dailyGoalMinutes: 10 | 20 | 30 | 60;
  masteredCount: number;
  totalConceptsCount: number;
  examHistory: ExamResult[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in';

export interface Question {
  id: string;
  type: QuestionType;
  conceptId: string;
  conceptTerm: string;
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string; // or boolean or string option
  explanation: string;
  matchingPairs?: { id: string; left: string; right: string }[];
}

export interface FeynmanEvaluation {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  missingConcepts: string[];
  improvedVersion: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'learn'
  | 'flashcards'
  | 'matching'
  | 'quiz'
  | 'feynman'
  | 'exam'
  | 'cram'
  | 'concepts'
  | 'progress';
