"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { ScoreEntry } from "@/lib/types";
import { formatDuration } from "../RankingTable";
import styles from "../site.module.css";

type Props = {
  slug: string;
  title: string;
  entries: ScoreEntry[];
};

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  // Prevent spreadsheet formula injection and escape quotes.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Every run with full names, for the teacher only. */
export function ScoresManager({ slug, title, entries }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const sorted = useMemo(() => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [entries]);
  const term = filter.trim().toLowerCase();
  const visible = term ? sorted.filter((e) => `${e.fullName} ${e.nickname}`.toLowerCase().includes(term)) : sorted;

  async function remove(entry: ScoreEntry) {
    if (!window.confirm(`Apagar a partida de ${entry.fullName} (${entry.nickname}, ${entry.score} pts)?`)) return;
    try {
      await api(`/api/phases/${slug}/scores/${entry.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao apagar.");
    }
  }

  function exportCsv() {
    const header = ["Nome completo", "Apelido", "Pontos", "Acertos", "Total", "Estrelas", "Concluiu", "Tempo", "Data"];
    const lines = sorted.map((e) =>
      [e.fullName, e.nickname, e.score, e.correct, e.total, e.stars, e.completed ? "sim" : "não", formatDuration(e.durationMs), new Date(e.createdAt).toLocaleString("pt-BR")]
        .map(csvCell)
        .join(";"),
    );
    const blob = new Blob(["﻿" + [header.map(csvCell).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={`panel ${styles.scoresPanel}`} aria-labelledby="scores-title">
      <div className={styles.scoresHead}>
        <h2 id="scores-title">Partidas de “{title}” ({entries.length})</h2>
        <div className={styles.headActions}>
          <input className={styles.search} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar aluno…" aria-label="Buscar aluno" />
          <button type="button" className="btn btn-sm" onClick={exportCsv} disabled={entries.length === 0}>
            Baixar planilha (CSV)
          </button>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {visible.length === 0 ? (
        <p className={styles.empty}>{entries.length === 0 ? "Nenhum aluno jogou esta fase ainda." : "Nenhum resultado para a busca."}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Nome completo</th>
                <th scope="col">Apelido</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  Pontos
                </th>
                <th scope="col" style={{ textAlign: "center" }}>
                  Acertos
                </th>
                <th scope="col" style={{ textAlign: "center" }}>
                  Tempo
                </th>
                <th scope="col">Data</th>
                <th scope="col">
                  <span className="visually-hidden">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id}>
                  <td>{e.fullName}</td>
                  <td>
                    <b>{e.nickname}</b>
                  </td>
                  <td style={{ textAlign: "right" }}>{e.score}</td>
                  <td style={{ textAlign: "center" }}>
                    {e.correct}/{e.total} {e.completed ? "🏁" : ""}
                  </td>
                  <td style={{ textAlign: "center" }}>{formatDuration(e.durationMs)}</td>
                  <td>{new Date(e.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(e)}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
