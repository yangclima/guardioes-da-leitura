import {
  COMPLETION_BONUS,
  DIFFICULTY_MULTIPLIER,
  MAX_TIME_BONUS,
  MIN_SECONDS_PER_QUESTION,
  PAR_SECONDS_PER_QUESTION,
  POINTS_PER_CORRECT,
  POINTS_PER_HEART_LEFT,
  POINTS_PER_STAR,
  STARS_PER_SEGMENT,
  TIME_BONUS_PER_SECOND,
} from "./gameRules";
import type { Phase } from "./types";

export interface RunReport {
  answers: { questionId: string; choice: number }[];
  stars: number;
  heartsLeft: number;
  durationMs: number;
}

export interface ScoreBreakdown {
  score: number;
  correct: number;
  total: number;
  stars: number;
  completed: boolean;
  correctPoints: number;
  starPoints: number;
  completionBonus: number;
  heartBonus: number;
  timeBonus: number;
}

export type ScoreResult = { ok: true; breakdown: ScoreBreakdown } | { ok: false; error: string };

/**
 * Recomputes the score on the server from what can be verified:
 * answers are checked against the key, stars are capped to what the
 * level contains and the duration comes from the signed run token.
 */
export function computeScore(phase: Pick<Phase, "questions" | "difficulty" | "hearts">, report: RunReport): ScoreResult {
  const total = phase.questions.length;
  if (report.answers.length > total) return { ok: false, error: "Respostas demais para esta fase." };

  let correct = 0;
  for (let i = 0; i < report.answers.length; i++) {
    const answer = report.answers[i];
    const question = phase.questions[i];
    if (answer.questionId !== question.id) return { ok: false, error: "Ordem de respostas inválida." };
    if (answer.choice === question.correctIndex) correct++;
  }

  const answered = report.answers.length;
  const durationSec = report.durationMs / 1000;
  if (answered > 0 && durationSec < answered * MIN_SECONDS_PER_QUESTION) {
    return { ok: false, error: "Partida rápida demais para ser válida." };
  }

  const heartsLeft = Math.max(0, Math.min(report.heartsLeft, phase.hearts));
  const completed = answered === total && heartsLeft > 0;
  const stars = Math.max(0, Math.min(report.stars, total * STARS_PER_SEGMENT));

  const correctPoints = Math.round(correct * POINTS_PER_CORRECT * DIFFICULTY_MULTIPLIER[phase.difficulty]);
  const starPoints = stars * POINTS_PER_STAR;
  const completionBonus = completed ? COMPLETION_BONUS : 0;
  const heartBonus = completed ? heartsLeft * POINTS_PER_HEART_LEFT : 0;
  const par = total * PAR_SECONDS_PER_QUESTION;
  const timeBonus = completed
    ? Math.max(0, Math.min(MAX_TIME_BONUS, Math.round((par - durationSec) * TIME_BONUS_PER_SECOND)))
    : 0;

  return {
    ok: true,
    breakdown: {
      score: correctPoints + starPoints + completionBonus + heartBonus + timeBonus,
      correct,
      total,
      stars,
      completed,
      correctPoints,
      starPoints,
      completionBonus,
      heartBonus,
      timeBonus,
    },
  };
}
