"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/apiClient";
import { SAMPLE_PHASE_INPUT } from "@/lib/samplePhase";
import { MODE_LABELS, THEME_LABELS, type Mode, type Phase, type Theme } from "@/lib/types";
import styles from "../site.module.css";

export interface PhaseSummary {
  slug: string;
  title: string;
  theme: Theme;
  mode: Mode;
  active: boolean;
  questionCount: number;
  scoreCount: number;
  playerCount: number;
  updatedAt: string;
}

export function TeacherDashboard({ phases }: { phases: PhaseSummary[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function run(key: string, task: () => Promise<string>) {
    setBusy(key);
    setMessage("");
    try {
      setMessage(await task());
      setIsError(false);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Algo deu errado.");
      setIsError(true);
    } finally {
      setBusy("");
    }
  }

  const toggleActive = (p: PhaseSummary) =>
    run(`toggle-${p.slug}`, async () => {
      const full = await api<Phase>(`/api/phases/${p.slug}`);
      await api(`/api/phases/${p.slug}`, { method: "PUT", json: { ...full, active: !p.active } });
      return p.active ? `“${p.title}” foi escondida dos alunos.` : `“${p.title}” está visível para os alunos.`;
    });

  const remove = (p: PhaseSummary) => {
    const warning = p.scoreCount > 0 ? `\n\nAs ${p.scoreCount} pontuações desta fase também serão apagadas.` : "";
    if (!window.confirm(`Apagar a fase “${p.title}”?${warning}`)) return;
    void run(`del-${p.slug}`, async () => {
      await api(`/api/phases/${p.slug}`, { method: "DELETE" });
      return `Fase “${p.title}” apagada.`;
    });
  };

  const createSample = () =>
    run("sample", async () => {
      const taken = new Set(phases.map((p) => p.slug));
      let slug = SAMPLE_PHASE_INPUT.slug;
      for (let n = 2; taken.has(slug); n++) slug = `${SAMPLE_PHASE_INPUT.slug}-${n}`;
      await api("/api/phases", { method: "POST", json: { ...SAMPLE_PHASE_INPUT, slug } });
      return `Fase de exemplo criada em /fase/${slug}.`;
    });

  const copyLink = (slug: string) =>
    run(`copy-${slug}`, async () => {
      const url = `${window.location.origin}/fase/${slug}`;
      await navigator.clipboard.writeText(url);
      return `Link copiado: ${url}`;
    });

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/professor");
    router.refresh();
  };

  return (
    <section className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.heroKicker}>Painel do professor</p>
          <h1 className={styles.pageTitle}>Suas fases</h1>
          <p className={styles.muted}>Cada fase tem um endereço próprio e um ranking próprio. Compartilhe o link com a turma.</p>
        </div>
        <div className={styles.headActions}>
          <Link href="/professor/fase/nova" className="btn btn-primary">
            + Nova fase
          </Link>
          <button type="button" className="btn" onClick={() => void createSample()} disabled={busy === "sample"}>
            Criar fase de exemplo
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </div>

      {message && (
        <p className={isError ? styles.error : styles.notice} role="status">
          {message}
        </p>
      )}

      {phases.length === 0 ? (
        <div className={`panel ${styles.emptyState}`}>
          <p>Nenhuma fase ainda. Crie a primeira ou comece pela fase de exemplo.</p>
        </div>
      ) : (
        <ul className={styles.teacherList}>
          {phases.map((p) => (
            <li key={p.slug} className={`panel ${styles.teacherItem}`}>
              <div className={styles.teacherInfo}>
                <span className={p.active ? styles.statusOn : styles.statusOff}>{p.active ? "Publicada" : "Oculta"}</span>
                <h2>{p.title}</h2>
                <p className={styles.muted}>
                  <code>/fase/{p.slug}</code> · {THEME_LABELS[p.theme]} · {MODE_LABELS[p.mode].split(" (")[0]}
                </p>
                <p className={styles.stats}>
                  <span>
                    <b>{p.questionCount}</b> questões
                  </span>
                  <span>
                    <b>{p.playerCount}</b> alunos
                  </span>
                  <span>
                    <b>{p.scoreCount}</b> partidas
                  </span>
                </p>
              </div>
              <div className={styles.teacherActions}>
                <Link href={`/professor/fase/${p.slug}`} className="btn btn-sm btn-primary">
                  Editar e notas
                </Link>
                <a href={`/fase/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                  Abrir ↗
                </a>
                <button type="button" className="btn btn-sm" onClick={() => void copyLink(p.slug)}>
                  Copiar link
                </button>
                <button type="button" className="btn btn-sm" onClick={() => void toggleActive(p)} disabled={busy === `toggle-${p.slug}`}>
                  {p.active ? "Ocultar" : "Publicar"}
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(p)} disabled={busy === `del-${p.slug}`}>
                  Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
