import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration, RankingTable } from "@/components/RankingTable";
import styles from "@/components/site.module.css";
import { phaseRanking } from "@/lib/ranking";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/fase/[slug]/ranking">): Promise<Metadata> {
  const phase = await getStore().getPhase((await params).slug);
  return { title: phase ? `Ranking – ${phase.title}` : "Ranking" };
}

export default async function PhaseRankingPage({ params }: PageProps<"/fase/[slug]/ranking">) {
  const { slug } = await params;
  const store = getStore();
  const phase = await store.getPhase(slug);
  if (!phase || !phase.active) notFound();
  const rows = phaseRanking(await store.listScores(slug));

  return (
    <section className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.heroKicker}>Ranking da fase</p>
          <h1 className={styles.pageTitle}>{phase.title}</h1>
          <p className={styles.muted}>Vale a melhor partida de cada apelido.</p>
        </div>
        <div className={styles.headActions}>
          <Link href={`/fase/${slug}`} className="btn btn-primary">
            Jogar esta fase
          </Link>
          <Link href="/ranking" className="btn">
            Ranking geral
          </Link>
        </div>
      </div>
      <RankingTable
        rows={rows}
        caption={`Ranking da fase ${phase.title}`}
        empty="Ainda não há pontuações nesta fase. Jogue e seja o primeiro!"
        getKey={(r) => r.nickname}
        getPosition={(r) => r.position}
        columns={[
          { label: "Apelido", render: (r) => <b>{r.nickname}</b> },
          { label: "Pontos", render: (r) => r.score, align: "right" },
          { label: "Acertos", render: (r) => `${r.correct}/${r.total}`, align: "center" },
          { label: "Tempo", render: (r) => formatDuration(r.durationMs), align: "center" },
          { label: "", render: (r) => (r.completed ? "🏁" : ""), align: "center" },
        ]}
      />
    </section>
  );
}
