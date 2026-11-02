import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhaseEditor } from "@/components/teacher/PhaseEditor";
import styles from "@/components/site.module.css";
import { isTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova fase" };

export default async function NewPhasePage() {
  if (!(await isTeacher())) redirect("/professor");
  return (
    <section className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.heroKicker}>Painel do professor</p>
          <h1 className={styles.pageTitle}>Nova fase</h1>
        </div>
      </div>
      <PhaseEditor phase={null} />
    </section>
  );
}
