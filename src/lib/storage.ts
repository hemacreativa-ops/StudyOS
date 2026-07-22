import { Concept, UserStats, ExamResult } from '../types';
import { INITIAL_CONCEPTS } from '../data/defaultConcepts';

const CONCEPTS_KEY = 'mkt_study_concepts_v1';
const STATS_KEY = 'mkt_study_stats_v1';

export function getStoredConcepts(): Concept[] {
  try {
    const raw = localStorage.getItem(CONCEPTS_KEY);
    if (!raw) {
      saveStoredConcepts(INITIAL_CONCEPTS);
      return INITIAL_CONCEPTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStoredConcepts(INITIAL_CONCEPTS);
      return INITIAL_CONCEPTS;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading concepts from storage:', e);
    return INITIAL_CONCEPTS;
  }
}

export function saveStoredConcepts(concepts: Concept[]): void {
  try {
    const json = JSON.stringify(concepts);
    localStorage.setItem(CONCEPTS_KEY, json);
  } catch (e) {
    console.error('Error saving concepts to storage:', e);
  }
}

export function getStoredStats(): UserStats {
  const defaultStats: UserStats = {
    streakDays: 4,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalStudyMinutes: 145,
    todayStudyMinutes: 15,
    dailyGoalMinutes: 20,
    masteredCount: INITIAL_CONCEPTS.filter(c => c.masteryLevel >= 80).length,
    totalConceptsCount: INITIAL_CONCEPTS.length,
    examHistory: [
      {
        id: 'ex-1',
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: 'Mini Cuestionario: Métricas Digitales',
        score: 90,
        totalQuestions: 5,
        correctAnswers: 4,
        timeSpentSeconds: 180,
        mode: 'mini',
      },
      {
        id: 'ex-2',
        date: new Date(Date.now() - 86400000 * 5).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: 'Simulacro de Examen: Fundamentos & Growth',
        score: 82,
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpentSeconds: 420,
        mode: 'final',
      }
    ],
  };

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      saveStoredStats(defaultStats);
      return defaultStats;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stats from storage:', e);
    return defaultStats;
  }
}

export function saveStoredStats(stats: UserStats): void {
  try {
    const json = JSON.stringify(stats);
    localStorage.setItem(STATS_KEY, json);
  } catch (e) {
    console.error('Error saving stats to storage:', e);
  }
}

export function updateSpacedRepetition(
  conceptId: string,
  isCorrect: boolean,
  currentConcepts: Concept[]
): Concept[] {
  const updated = currentConcepts.map(c => {
    if (c.id !== conceptId) return c;

    let newInterval = c.reviewIntervalDays || 1;
    let newMastery = c.masteryLevel;
    let correct = c.timesCorrect + (isCorrect ? 1 : 0);
    let incorrect = c.timesIncorrect + (isCorrect ? 0 : 1);

    if (isCorrect) {
      // Increase interval in Spaced Repetition ladder: 1d -> 3d -> 7d -> 14d -> 30d
      if (newInterval === 1) newInterval = 3;
      else if (newInterval === 3) newInterval = 7;
      else if (newInterval === 7) newInterval = 14;
      else if (newInterval === 14) newInterval = 30;
      else newInterval = 45;

      newMastery = Math.min(100, newMastery + 15);
    } else {
      // Reset interval to 1 day on error
      newInterval = 1;
      newMastery = Math.max(10, newMastery - 20);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);

    return {
      ...c,
      masteryLevel: newMastery,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: nextDate.toISOString(),
      reviewIntervalDays: newInterval,
      timesCorrect: correct,
      timesIncorrect: incorrect,
    };
  });

  saveStoredConcepts(updated);
  return updated;
}
