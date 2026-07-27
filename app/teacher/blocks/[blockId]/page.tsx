import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeacherNav } from "@/components/TeacherNav";
import { VerticalTracker } from "@/components/VerticalTracker";

export const dynamic = "force-dynamic";

export default async function TeacherBlockPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  await requireTeacherPage();
  const { blockId } = await params;
  const block = await prisma.block.findUnique({ where: { id: blockId }, include: { teacher: true } });
  if (!block) notFound();

  return (
    <div className="flex flex-1 flex-col bg-cream px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <TeacherNav />
        <Link
          href={`/teacher/teachers/${block.teacherId}`}
          className="mb-2 inline-block text-sm text-ink-soft hover:underline"
        >
          ← {block.teacher.name}
        </Link>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">{block.name}</h1>
          <Link
            href={`/teacher/blocks/${blockId}/roster`}
            className="rounded-full bg-cream-soft px-4 py-2 text-sm font-medium text-ink hover:bg-pastel-pink-bg"
          >
            Manage roster
          </Link>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Tap any student to open their tracker and check off progress directly — no PIN needed
          here.
        </p>
        <VerticalTracker blockId={blockId} isTeacher />
      </div>
    </div>
  );
}
