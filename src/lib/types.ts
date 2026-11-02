export const THEMES = ["floresta", "deserto", "neve", "caverna", "ceu", "espaco"] as const;
export type Theme = (typeof THEMES)[number];

export const MODES = ["plataforma", "voo", "misto"] as const;
export type Mode = (typeof MODES)[number];

export type SegmentMode = "plataforma" | "voo";

export const THEME_LABELS: Record<Theme, string> = {
  floresta: "Floresta encantada",
  deserto: "Deserto dos dinossauros",
  neve: "Montanhas geladas",
  caverna: "Caverna de cristais",
  ceu: "Céu tempestuoso",
  espaco: "Cinturão de asteroides",
};

export const MODE_LABELS: Record<Mode, string> = {
  plataforma: "Plataforma (correr e pular)",
  voo: "Voo (desviar de obstáculos)",
  misto: "Misto (alterna a cada desafio)",
};

export interface Question {
  id: string;
  descriptor: string;
  supportText: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Question as sent to players: no answer key. */
export type PublicQuestion = Omit<Question, "correctIndex" | "explanation">;

export interface Phase {
  slug: string;
  title: string;
  description: string;
  theme: Theme;
  mode: Mode;
  difficulty: 1 | 2 | 3;
  hearts: number;
  active: boolean;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type PublicPhase = Omit<Phase, "questions"> & { questions: PublicQuestion[] };

export interface ScoreEntry {
  id: string;
  slug: string;
  nickname: string;
  fullName: string;
  score: number;
  correct: number;
  total: number;
  stars: number;
  durationMs: number;
  completed: boolean;
  hero: string;
  createdAt: string;
}

/** Ranking row safe to show publicly (no full name). */
export interface RankingRow {
  position: number;
  nickname: string;
  score: number;
  correct: number;
  total: number;
  completed: boolean;
  durationMs: number;
  createdAt: string;
}

export interface GeneralRankingRow {
  position: number;
  nickname: string;
  totalScore: number;
  phasesPlayed: number;
  phasesCompleted: number;
}
