"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import type { ScoreBreakdown } from "@/lib/scoring";
import styles from "./game.module.css";

const STORAGE_KEY = "guardioes:player";

interface SubmitResult {
  breakdown: ScoreBreakdown;
  position: number | null;
}

type Props = {
  slug: string;
  runToken: string;
  heroId: string;
  completed: boolean;
  stars: number;
  heartsLeft: number;
  answers: { questionId: string; choice: number }[];
  correctCount: number;
  total: number;
  onPlayAgain: () => void;
};

function loadSaved(): { fullName: string; nickname: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { fullName: "", nickname: "", ...(JSON.parse(raw) as object) };
  } catch {
    // Storage blocked: start with empty fields.
  }
  return { fullName: "", nickname: "" };
}

export function ResultPanel({ slug, runToken, heroId, completed, stars, heartsLeft, answers, correctCount, total, onPlayAgain }: Props) {
  const [saved] = useState(loadSaved);
  const [fullName, setFullName] = useState(saved.fullName);
  const [nickname, setNickname] = useState(saved.nickname);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSending(true);
    setError("");
    try {
      const data = await api<SubmitResult>(`/api/phases/${slug}/scores`, {
        method: "POST",
        json: { runToken, fullName, nickname, hero: heroId, stars, heartsLeft, answers },
      });
      setResult(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ fullName, nickname }));
      } catch {
        // Not critical.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.resultCard} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <p className={styles.resultEmoji} aria-hidden="true">
          {completed ? "🏆" : "💫"}
        </p>
        <h2 id="result-title" className={styles.resultTitle}>
          {completed ? "Missão concluída!" : "Fim de jogo!"}
        </h2>
        <p className={styles.resultSummary}>
          Você acertou <strong>{correctCount}</strong> de <strong>{total}</strong> e pegou <strong>{stars}</strong> ★
        </p>

        {result ? (
          <>
            <div className={styles.scoreBig}>
              <span>{result.breakdown.score}</span>
              <small>pontos</small>
            </div>
            <ul className={styles.breakdown}>
              <li>Acertos <b>+{result.breakdown.correctPoints}</b></li>
              <li>Estrelas <b>+{result.breakdown.starPoints}</b></li>
              {result.breakdown.completionBonus > 0 && <li>Missão completa <b>+{result.breakdown.completionBonus}</b></li>}
              {result.breakdown.heartBonus > 0 && <li>Corações restantes <b>+{result.breakdown.heartBonus}</b></li>}
              {result.breakdown.timeBonus > 0 && <li>Bônus de tempo <b>+{result.breakdown.timeBonus}</b></li>}
            </ul>
            {result.position && (
              <p className={styles.positionText}>
                <b>{nickname}</b> está em <b>{result.position}º lugar</b> nesta fase!
              </p>
            )}
            <div className={styles.resultActions}>
              <Link href={`/fase/${slug}/ranking`} className="btn btn-primary">
                Ver ranking da fase
              </Link>
              <button type="button" className="btn" onClick={onPlayAgain}>
                Jogar de novo ↺
              </button>
              <Link href="/ranking" className="btn btn-ghost">
                Ranking geral
              </Link>
            </div>
          </>
        ) : (
          <form className={styles.resultForm} onSubmit={handleSubmit}>
            <label className="field">
              <span>Nome completo</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required minLength={3} maxLength={80} placeholder="Ex.: Maria Clara Souza" />
              <small>Só o professor vê o seu nome.</small>
            </label>
            <label className="field">
              <span>Apelido no ranking</span>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="nickname" required minLength={2} maxLength={20} placeholder="Ex.: MariGuardiã" />
              <small>É o nome que aparece para todos.</small>
            </label>
            {error && (
              <p className={styles.errorText} role="alert">
                {error}
              </p>
            )}
            <div className={styles.resultActions}>
              <button type="submit" className="btn btn-primary" disabled={isSending}>
                {isSending ? "Salvando…" : "Salvar pontuação"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onPlayAgain}>
                Jogar de novo sem salvar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
