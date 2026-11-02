"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { DIFFICULTY_LABELS } from "@/lib/gameRules";
import { MAX_QUESTIONS } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { MODE_LABELS, MODES, THEME_LABELS, THEMES, type Mode, type Phase, type Theme } from "@/lib/types";
import { QuestionEditor, type QuestionDraft } from "./QuestionEditor";
import styles from "./editor.module.css";

let keySeq = 0;
const newKey = () => `k${Date.now().toString(36)}${keySeq++}`;

const blankQuestion = (): QuestionDraft => ({
  key: newKey(),
  descriptor: "",
  supportText: "",
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

interface Draft {
  title: string;
  slug: string;
  description: string;
  theme: Theme;
  mode: Mode;
  difficulty: 1 | 2 | 3;
  hearts: number;
  active: boolean;
  questions: QuestionDraft[];
}

function toDraft(phase: Phase | null): Draft {
  if (!phase) {
    return { title: "", slug: "", description: "", theme: "floresta", mode: "misto", difficulty: 1, hearts: 3, active: true, questions: [blankQuestion()] };
  }
  return {
    title: phase.title,
    slug: phase.slug,
    description: phase.description,
    theme: phase.theme,
    mode: phase.mode,
    difficulty: phase.difficulty,
    hearts: phase.hearts,
    active: phase.active,
    questions: phase.questions.map((q) => ({ ...q, key: newKey() })),
  };
}

const THEME_SWATCH: Record<Theme, string> = {
  floresta: "linear-gradient(135deg,#7cc8ff,#6fcf4a)",
  deserto: "linear-gradient(135deg,#ff9f5a,#f3d08a)",
  neve: "linear-gradient(135deg,#93b9f0,#ffffff)",
  caverna: "linear-gradient(135deg,#151332,#8b7fc7)",
  ceu: "linear-gradient(135deg,#3f5f8f,#a7bcd9)",
  espaco: "linear-gradient(135deg,#070720,#f472b6)",
};

export function PhaseEditor({ phase }: { phase: Phase | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(phase));
  const [slugTouched, setSlugTouched] = useState(!!phase);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isNew = !phase;

  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((d) => ({ ...d, [field]: value }));

  const setTitle = (title: string) => setDraft((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));

  const setQuestion = (i: number, q: QuestionDraft) => update("questions", draft.questions.map((x, j) => (j === i ? q : x)));

  const moveQuestion = (i: number, delta: -1 | 1) => {
    const list = [...draft.questions];
    const [item] = list.splice(i, 1);
    list.splice(i + delta, 0, item);
    update("questions", list);
  };

  const duplicateQuestion = (i: number) => {
    const copy = { ...draft.questions[i], key: newKey(), id: undefined };
    update("questions", [...draft.questions.slice(0, i + 1), copy, ...draft.questions.slice(i + 1)]);
  };

  const removeQuestion = (i: number) => {
    if (!window.confirm(`Remover a questão ${i + 1}?`)) return;
    update("questions", draft.questions.filter((_, j) => j !== i));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    const payload = {
      ...draft,
      questions: draft.questions.map((q) => ({ id: q.id, descriptor: q.descriptor, supportText: q.supportText, prompt: q.prompt, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
    };
    try {
      const url = isNew ? "/api/phases" : `/api/phases/${phase.slug}`;
      await api<Phase>(url, { method: isNew ? "POST" : "PUT", json: payload });
      router.push("/professor/painel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={`panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>1. Sobre a fase</h2>
        <div className={styles.row2}>
          <label className="field">
            <span>Título *</span>
            <input value={draft.title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} placeholder="Ex.: Trilha das Pistas" />
          </label>
          <label className="field">
            <span>Endereço (URL) *</span>
            <div className={styles.slugInput}>
              <span>/fase/</span>
              <input
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                required
                maxLength={60}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="trilha-das-pistas"
              />
            </div>
            <small>Só letras minúsculas, números e hífens. É o link que os alunos vão abrir.</small>
          </label>
        </div>
        <label className="field">
          <span>Descrição</span>
          <input value={draft.description} onChange={(e) => update("description", e.target.value)} maxLength={400} placeholder="Uma frase sobre a missão" />
        </label>
      </div>

      <div className={`panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>2. Cenário e regras</h2>
        <div className={styles.themeGrid} role="radiogroup" aria-label="Cenário">
          {THEMES.map((t) => (
            <label key={t} className={draft.theme === t ? `${styles.themeOption} ${styles.themeActive}` : styles.themeOption}>
              <input type="radio" name="theme" value={t} checked={draft.theme === t} onChange={() => update("theme", t)} className="visually-hidden" />
              <span className={styles.swatch} style={{ background: THEME_SWATCH[t] }} aria-hidden="true" />
              <span>{THEME_LABELS[t]}</span>
            </label>
          ))}
        </div>
        <div className={styles.row3}>
          <label className="field">
            <span>Modo de jogo</span>
            <select value={draft.mode} onChange={(e) => update("mode", e.target.value as Mode)}>
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dificuldade</span>
            <select value={draft.difficulty} onChange={(e) => update("difficulty", Number(e.target.value) as 1 | 2 | 3)}>
              {([1, 2, 3] as const).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Corações</span>
            <input type="number" min={1} max={6} value={draft.hearts} onChange={(e) => update("hearts", Math.max(1, Math.min(6, Number(e.target.value) || 1)))} />
          </label>
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={draft.active} onChange={(e) => update("active", e.target.checked)} />
          <span>Publicada (alunos podem jogar e ver o ranking)</span>
        </label>
      </div>

      <div className={styles.questionsHead}>
        <h2 className={styles.cardTitle}>3. Questões ({draft.questions.length})</h2>
        <p className={styles.hint}>Cada questão vira um trecho da fase com um portal no final.</p>
      </div>
      {draft.questions.map((q, i) => (
        <QuestionEditor
          key={q.key}
          question={q}
          index={i}
          count={draft.questions.length}
          onChange={(next) => setQuestion(i, next)}
          onMove={(delta) => moveQuestion(i, delta)}
          onDuplicate={() => duplicateQuestion(i)}
          onRemove={() => removeQuestion(i)}
        />
      ))}
      {draft.questions.length < MAX_QUESTIONS && (
        <button type="button" className={`btn ${styles.addQuestion}`} onClick={() => update("questions", [...draft.questions, blankQuestion()])}>
          + Adicionar questão
        </button>
      )}

      <div className={styles.saveBar}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Link href="/professor/painel" className="btn btn-ghost">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving}>
          {isSaving ? "Salvando…" : isNew ? "Criar fase" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
