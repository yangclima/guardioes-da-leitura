"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import type { PublicQuestion } from "@/lib/types";
import styles from "./game.module.css";

const LETTERS = ["A", "B", "C", "D", "E"];

interface CheckResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

type Props = {
  slug: string;
  runToken: string;
  question: PublicQuestion;
  index: number;
  total: number;
  onDone: (choice: number, correct: boolean) => void;
};

export function QuestionModal({ slug, runToken, question, index, total, onDone }: Props) {
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>("button[data-option]")?.focus();
  }, []);

  useEffect(() => {
    if (result) continueRef.current?.focus();
  }, [result]);

  async function answer(selected: number) {
    if (isChecking || result) return;
    setChoice(selected);
    setIsChecking(true);
    setError("");
    try {
      const data = await api<CheckResult>(`/api/phases/${slug}/check`, {
        method: "POST",
        json: { runToken, questionId: question.id, choice: selected },
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao conferir a resposta.");
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result) return;
      const n = Number(e.key);
      const letter = LETTERS.indexOf(e.key.toUpperCase());
      const pick = n >= 1 && n <= question.options.length ? n - 1 : letter;
      if (pick >= 0 && pick < question.options.length) void answer(pick);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const optionClass = (i: number) => {
    if (!result) return choice === i ? `${styles.option} ${styles.optionPending}` : styles.option;
    if (i === result.correctIndex) return `${styles.option} ${styles.optionRight}`;
    if (i === choice) return `${styles.option} ${styles.optionWrong}`;
    return `${styles.option} ${styles.optionDim}`;
  };

  return (
    <div className={styles.modalBackdrop}>
      <div ref={dialogRef} className={styles.questionCard} role="dialog" aria-modal="true" aria-labelledby="question-prompt">
        <header className={styles.questionHead}>
          <span className={styles.badge}>Desafio {index + 1}/{total}</span>
          {question.descriptor && <span className={`${styles.badge} ${styles.badgeAlt}`}>{question.descriptor}</span>}
        </header>
        {question.supportText && <blockquote className={styles.supportText}>{question.supportText}</blockquote>}
        <h2 id="question-prompt" className={styles.prompt}>
          {question.prompt}
        </h2>
        <div className={styles.options}>
          {question.options.map((opt, i) => (
            <button
              key={`${question.id}-${i}`}
              type="button"
              data-option
              className={optionClass(i)}
              disabled={isChecking || !!result}
              onClick={() => void answer(i)}
            >
              <span className={styles.optionLetter}>{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
        {error && (
          <p className={styles.errorText} role="alert">
            {error}{" "}
            <button type="button" className={styles.linkButton} onClick={() => choice !== null && void answer(choice)}>
              Tentar de novo
            </button>
          </p>
        )}
        {result && (
          <div className={result.correct ? styles.feedbackRight : styles.feedbackWrong} role="status">
            <strong>{result.correct ? "Resposta certa! +pontos" : "Não foi dessa vez… você perdeu 1 coração."}</strong>
            {result.explanation && <p>{result.explanation}</p>}
            <button ref={continueRef} type="button" className="btn btn-primary" onClick={() => onDone(choice ?? -1, result.correct)}>
              Continuar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
