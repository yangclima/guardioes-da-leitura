"use client";

import { MAX_OPTIONS, MIN_OPTIONS } from "@/lib/schemas";
import styles from "./editor.module.css";

export interface QuestionDraft {
  key: string;
  id?: string;
  descriptor: string;
  supportText: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LETTERS = ["A", "B", "C", "D", "E"];

type Props = {
  question: QuestionDraft;
  index: number;
  count: number;
  onChange: (next: QuestionDraft) => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function QuestionEditor({ question: q, index, count, onChange, onMove, onDuplicate, onRemove }: Props) {
  const set = <K extends keyof QuestionDraft>(field: K, value: QuestionDraft[K]) => onChange({ ...q, [field]: value });

  const setOption = (i: number, value: string) => set("options", q.options.map((o, j) => (j === i ? value : o)));

  const addOption = () => set("options", [...q.options, ""]);

  const removeOption = (i: number) => {
    const options = q.options.filter((_, j) => j !== i);
    const correctIndex = q.correctIndex === i ? 0 : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex;
    onChange({ ...q, options, correctIndex });
  };

  const idBase = `q-${q.key}`;

  return (
    <section className={styles.question} aria-label={`Questão ${index + 1}`}>
      <header className={styles.questionLegend}>
        <span className={styles.questionNum}>Questão {index + 1}</span>
        <span className={styles.questionTools}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Mover para cima">
            ↑
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Mover para baixo">
            ↓
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDuplicate}>
            Duplicar
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={onRemove} disabled={count === 1}>
            Remover
          </button>
        </span>
      </header>

      <div className={styles.row2}>
        <label className="field">
          <span>Descritor</span>
          <input value={q.descriptor} onChange={(e) => set("descriptor", e.target.value)} placeholder="Ex.: D6" maxLength={20} />
        </label>
        <label className="field">
          <span>Enunciado *</span>
          <input value={q.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder="Ex.: Qual é o assunto principal do texto?" maxLength={1000} required />
        </label>
      </div>

      <label className="field">
        <span>Texto de apoio (opcional)</span>
        <textarea value={q.supportText} onChange={(e) => set("supportText", e.target.value)} rows={4} maxLength={4000} placeholder="Cole aqui o trecho, poema, tirinha transcrita…" />
      </label>

      <div className={styles.optionsBlock} role="radiogroup" aria-label={`Alternativas da questão ${index + 1}`}>
        <span className={styles.optionsLabel}>Alternativas * — marque a correta</span>
        {q.options.map((opt, i) => (
          <div key={i} className={i === q.correctIndex ? `${styles.optionRow} ${styles.optionCorrect}` : styles.optionRow}>
            <label className={styles.correctPick} title="Marcar como correta">
              <input type="radio" name={`${idBase}-correct`} checked={i === q.correctIndex} onChange={() => set("correctIndex", i)} />
              <span>{LETTERS[i]}</span>
            </label>
            <input
              className={styles.optionInput}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Alternativa ${LETTERS[i]}`}
              aria-label={`Alternativa ${LETTERS[i]}`}
              maxLength={400}
              required
            />
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeOption(i)} disabled={q.options.length <= MIN_OPTIONS} aria-label={`Remover alternativa ${LETTERS[i]}`}>
              ✕
            </button>
          </div>
        ))}
        {q.options.length < MAX_OPTIONS && (
          <button type="button" className="btn btn-sm" onClick={addOption}>
            + Alternativa
          </button>
        )}
      </div>

      <label className="field">
        <span>Explicação mostrada depois da resposta (opcional)</span>
        <textarea value={q.explanation} onChange={(e) => set("explanation", e.target.value)} rows={2} maxLength={1500} placeholder="Por que essa é a resposta certa?" />
      </label>
    </section>
  );
}
