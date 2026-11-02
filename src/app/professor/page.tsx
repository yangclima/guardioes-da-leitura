import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/teacher/LoginForm";
import styles from "@/components/site.module.css";
import { isTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Área do professor" };

export default async function TeacherLoginPage() {
  if (await isTeacher()) redirect("/professor/painel");
  return (
    <section className={styles.loginWrap}>
      <div className={`panel ${styles.loginCard}`}>
        <p className={styles.heroKicker}>Área do professor</p>
        <h1 className={styles.pageTitle}>Entrar</h1>
        <p className={styles.muted}>Use a senha do professor para criar e editar fases e ver os nomes completos dos alunos.</p>
        <LoginForm />
      </div>
    </section>
  );
}
