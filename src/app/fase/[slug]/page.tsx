import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameClient } from "@/components/game/GameClient";
import { toPublicPhase } from "@/lib/phases";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

async function loadPhase(slug: string) {
  const phase = await getStore().getPhase(slug);
  return phase && phase.active ? phase : null;
}

export async function generateMetadata({ params }: PageProps<"/fase/[slug]">): Promise<Metadata> {
  const phase = await loadPhase((await params).slug);
  return { title: phase?.title ?? "Fase não encontrada" };
}

export default async function PhasePage({ params }: PageProps<"/fase/[slug]">) {
  const phase = await loadPhase((await params).slug);
  if (!phase) notFound();
  return <GameClient key={phase.updatedAt} phase={toPublicPhase(phase)} />;
}
