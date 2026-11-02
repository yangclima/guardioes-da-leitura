import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhaseEditor } from "@/components/teacher/PhaseEditor";
import { ScoresManager } from "@/components/teacher/ScoresManager";
import styles from "@/components/site.module.css";
import { isTeacher } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar fase" };

export default async function EditPhasePage({ params }: PageProps<"/professor/fase/[slug]">) {
  if (!(await isTeacher())) redirect("/professor");
  const { slug } = await params;
  const store = getStore();
  const phase = await store.getPhase(slug);
  if (!phase) notFound();
  const entries = await store.listScores(slug);

  return (
    <section className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.heroKicker}>Editar fase</p>
          <h1 className={styles.pageTitle}>{phase.title}</h1>
          <p className={styles.muted}>
            Link dos alunos: <code>/fase/{phase.slug}</code>
          </p>
        </div>
        <div className={styles.headActions}>
          <Link href="/professor/painel" className="btn btn-ghost">
            ← Painel
          </Link>
          <a href={`/fase/${phase.slug}`} target="_blank" rel="noopener noreferrer" className="btn">
            Testar fase ↗
          </a>
        </div>
      </div>
      <ScoresManager slug={phase.slug} title={phase.title} entries={entries} />
      <PhaseEditor key={phase.updatedAt} phase={phase} />
    </section>
  );
}
