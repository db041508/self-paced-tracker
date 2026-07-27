import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeacherNav } from "@/components/TeacherNav";
import { RosterManager } from "@/components/RosterManager";

export const dynamic = "force-dynamic";

export default async function TeacherRosterPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  await requireTeacherPage();
  const { blockId } = await params;
  const block = await prisma.block.findUnique({ where: { id: blockId } });
  if (!block) notFound();

  return (
    <div className="flex flex-1 flex-col bg-cream px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <TeacherNav />
        <h1 className="mb-6 text-2xl font-bold text-ink">{block.name} — Roster</h1>
        <RosterManager blockId={blockId} />
      </div>
    </div>
  );
}
