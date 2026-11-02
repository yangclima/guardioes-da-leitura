import { z } from "zod";
import { MODES, THEMES } from "./types";
import { SLUG_PATTERN } from "./slug";

export const MAX_QUESTIONS = 30;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;

const trimmed = (max: number) => z.string().trim().max(max);

export const questionInputSchema = z
  .object({
    id: z.string().trim().min(1).max(40).optional(),
    descriptor: trimmed(20).default(""),
    supportText: trimmed(4000).default(""),
    prompt: trimmed(1000).min(3, "Escreva o enunciado da questão."),
    options: z
      .array(trimmed(400).min(1, "Alternativas não podem ficar vazias."))
      .min(MIN_OPTIONS, `Use pelo menos ${MIN_OPTIONS} alternativas.`)
      .max(MAX_OPTIONS, `Use no máximo ${MAX_OPTIONS} alternativas.`),
    correctIndex: z.number().int().min(0),
    explanation: trimmed(1500).default(""),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "Marque qual alternativa é a correta.",
    path: ["correctIndex"],
  });

export const phaseInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "O endereço precisa de pelo menos 2 caracteres.")
    .max(60)
    .regex(SLUG_PATTERN, "Use só letras minúsculas, números e hífens (ex.: fase-1)."),
  title: trimmed(80).min(2, "Dê um título para a fase."),
  description: trimmed(400).default(""),
  theme: z.enum(THEMES),
  mode: z.enum(MODES),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  hearts: z.number().int().min(1).max(6),
  active: z.boolean().default(true),
  questions: z
    .array(questionInputSchema)
    .min(1, "Adicione pelo menos uma questão.")
    .max(MAX_QUESTIONS, `No máximo ${MAX_QUESTIONS} questões por fase.`),
});

export type PhaseInput = z.infer<typeof phaseInputSchema>;

const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u;
const NICK_PATTERN = /^[\p{L}\p{M}\p{N}_ .-]+$/u;

export const scoreSubmissionSchema = z.object({
  runToken: z.string().min(10).max(600),
  fullName: z
    .string()
    .trim()
    .min(3, "Digite seu nome completo.")
    .max(80)
    .regex(NAME_PATTERN, "O nome deve ter apenas letras.")
    .refine((v) => v.split(/\s+/).length >= 2, "Digite nome e sobrenome."),
  nickname: z
    .string()
    .trim()
    .min(2, "O apelido precisa de pelo menos 2 letras.")
    .max(20, "Apelido com no máximo 20 caracteres.")
    .regex(NICK_PATTERN, "Use letras, números, espaço, _ . ou -"),
  hero: z.string().trim().max(20).default(""),
  stars: z.number().int().min(0).max(10_000),
  heartsLeft: z.number().int().min(0).max(10),
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(40), choice: z.number().int().min(-1).max(10) }))
    .max(MAX_QUESTIONS),
});

export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;

export const answerCheckSchema = z.object({
  runToken: z.string().min(10).max(600),
  questionId: z.string().min(1).max(40),
  choice: z.number().int().min(-1).max(10),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Digite a senha.").max(200),
});

/** Formats the first zod issue as a friendly message. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Dados inválidos.";
  return issue.message;
}
