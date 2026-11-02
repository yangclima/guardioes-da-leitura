import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TeacherDashboard, type PhaseSummary } from "@/components/teacher/TeacherDashboard";
import { isTeacher } from "@/lib/auth";
import { sortPhases } from "@/lib/phases";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel do professor" };

export default async function TeacherPanelPage() {
  if (!(await isTeacher())) redirect("/professor");
  const store = getStore();
  const phases = sortPhases(await store.listPhases());
  const counts = await Promise.all(phases.map((p) => store.listScores(p.slug)));
  const summaries: PhaseSummary[] = phases.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    theme: p.theme,
    mode: p.mode,
    active: p.active,
    questionCount: p.questions.length,
    scoreCount: counts[i].length,
    playerCount: new Set(counts[i].map((s) => s.nickname.toLowerCase())).size,
    updatedAt: p.updatedAt,
  }));
  return <TeacherDashboard phases={summaries} />;
}
