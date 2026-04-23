import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/app/server/db";
import { serializePlayable } from "@/app/server/serialize";
import { StandalonePlayable } from "./StandalonePlayable";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const p = await prisma.playable.findFirst({
    where: { id, visibility: "public", deletedAt: null },
    include: { creator: true },
  });
  if (!p) return { title: "Loopit" };
  return {
    title: `${p.title} · ${p.creator.handle} · Loopit`,
    description: p.description,
    openGraph: {
      title: p.title,
      description: p.description,
    },
  };
}

export default async function PlayablePage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.playable.findFirst({
    where: { id, visibility: "public", deletedAt: null },
    include: {
      creator: true,
      tags: { include: { tag: true } },
    },
  });
  if (!row) notFound();
  const wire = serializePlayable(row, null);

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-[460px] flex-col overflow-hidden bg-black">
      <StandalonePlayable item={wire} />
      <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <Link
          href={`/?p=${wire.id}`}
          className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 py-3 text-center text-[14px] font-bold text-white shadow-lg shadow-pink-500/40"
        >
          Open in Loopit
        </Link>
      </div>
    </main>
  );
}
