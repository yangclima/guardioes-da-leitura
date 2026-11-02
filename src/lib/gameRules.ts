/** Rules shared by the game client and the server-side score check. */
export const STARS_PER_SEGMENT = 6;
export const POINTS_PER_CORRECT = 100;
export const POINTS_PER_STAR = 10;
export const COMPLETION_BONUS = 200;
export const POINTS_PER_HEART_LEFT = 50;
export const PAR_SECONDS_PER_QUESTION = 45;
export const TIME_BONUS_PER_SECOND = 2;
export const MAX_TIME_BONUS = 300;
/** A run faster than this per question is not humanly possible. */
export const MIN_SECONDS_PER_QUESTION = 3;

export const DIFFICULTY_MULTIPLIER: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.25, 3: 1.5 };
export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = { 1: "Fácil", 2: "Médio", 3: "Difícil" };
