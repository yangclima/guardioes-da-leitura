import Link from "next/link";
import { DIFFICULTY_LABELS } from "@/lib/gameRules";
import { sortPhases } from "@/lib/phases";
import { loadGeneralRanking } from "@/lib/queries";
import { getStore } from "@/lib/store";
import { THEME_LABELS, type Theme } from "@/lib/types";
import styles from "@/components/site.module.css";

export const dynamic = "force-dynamic";

const THEME_EMOJI: Record<Theme, string> = {
  floresta: "🌳",
  deserto: "🦖",
  neve: "🏔️",
  caverna: "💎",
  ceu: "⛈️",
  espaco: "🪐",
};

export default async function HomePage() {
  const phases = sortPhases(await getStore().listPhases()).filter((p) => p.active);
  const top = await loadGeneralRanking(5);

  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Aventura de Língua Portuguesa</p>
          <h1 className={styles.heroTitle}>
            Corra, voe e <span>leia</span> para salvar o reino!
          </h1>
          <p className={styles.heroText}>
            Escolha seu guardião, atravesse florestas, desertos com dinossauros e tempestades no céu. Cada portal guarda uma pergunta: acerte para seguir e subir no ranking.
          </p>
        </div>
        <aside className={`panel ${styles.heroTop}`} aria-labelledby="top5">
          <h2 id="top5">Top 5 geral</h2>
          {top.length === 0 ? (
            <p className={styles.muted}>Ninguém pontuou ainda. Seja o primeiro!</p>
          ) : (
            <ol>
              {top.map((r) => (
                <li key={r.nickname}>
                  <i>{["🥇", "🥈", "🥉"][r.position - 1] ?? `${r.position}º`}</i>
                  <span>{r.nickname}</span>
                  <b>{r.totalScore}</b>
                </li>
              ))}
            </ol>
          )}
          <Link href="/ranking" className="btn btn-sm">
            Ver ranking completo
          </Link>
        </aside>
      </section>

      <section aria-labelledby="fases" className={styles.section}>
        <h2 id="fases" className={styles.sectionTitle}>
          Escolha uma fase
        </h2>
        {phases.length === 0 ? (
          <div className={`panel ${styles.emptyState}`}>
            <p>O professor ainda não publicou nenhuma fase.</p>
            <Link href="/professor" className="btn btn-primary">
              Sou professor
            </Link>
          </div>
        ) : (
          <ul className={styles.phaseGrid}>
            {phases.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/fase/${p.slug}`} className={`${styles.phaseCard} ${styles[`theme_${p.theme}`]}`}>
                  <span className={styles.phaseNum}>Fase {i + 1}</span>
                  <span className={styles.phaseEmoji} aria-hidden="true">
                    {THEME_EMOJI[p.theme]}
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.description || THEME_LABELS[p.theme]}</p>
                  <span className={styles.phaseMeta}>
                    {p.questions.length} desafios · {DIFFICULTY_LABELS[p.difficulty]}
                  </span>
                  <span className={styles.phaseUrl}>/fase/{p.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
