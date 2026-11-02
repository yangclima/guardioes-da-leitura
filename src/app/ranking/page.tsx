import type { Metadata } from "next";
import { RankingTable } from "@/components/RankingTable";
import styles from "@/components/site.module.css";
import { loadGeneralRanking } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ranking geral" };

export default async function GeneralRankingPage() {
  const rows = await loadGeneralRanking(200);
  return (
    <section className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.heroKicker}>Todas as fases</p>
          <h1 className={styles.pageTitle}>Ranking geral</h1>
          <p className={styles.muted}>Soma da melhor pontuação de cada apelido em cada fase.</p>
        </div>
      </div>
      <RankingTable
        rows={rows}
        caption="Ranking geral"
        empty="Ainda não há pontuações."
        getKey={(r) => r.nickname}
        getPosition={(r) => r.position}
        columns={[
          { label: "Apelido", render: (r) => <b>{r.nickname}</b> },
          { label: "Pontos", render: (r) => r.totalScore, align: "right" },
          { label: "Fases jogadas", render: (r) => r.phasesPlayed, align: "center" },
          { label: "Concluídas", render: (r) => r.phasesCompleted, align: "center" },
        ]}
      />
    </section>
  );
}
