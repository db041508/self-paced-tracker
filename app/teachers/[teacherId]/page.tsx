import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pastelForIndex } from "@/lib/pastel";

export const dynamic = "force-dynamic";

export default async function TeacherPeriodsPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { blocks: { include: { _count: { select: { students: true } } } } },
  });
  if (!teacher) notFound();

  const blocks = [...teacher.blocks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-1 flex-col items-center bg-cream px-6 py-16">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-3 inline-block text-sm text-ink-soft hover:underline"
        >
          ← All teachers
        </Link>
        <h1 className="mb-6 text-3xl font-bold text-ink">{teacher.name}</h1>

        {blocks.length === 0 ? (
          <p className="text-ink-soft">
            No periods have been set up yet for {teacher.name}.
          </p>
        ) : (
          <>
            <p className="mb-6 text-ink-soft">Pick a period to see the class progress.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {blocks.map((block, i) => {
                const palette = pastelForIndex(i);
                return (
                  <Link
                    key={block.id}
                    href={`/grid/${block.id}`}
                    className={`flex min-h-24 flex-col justify-center rounded-3xl border-2 ${palette.border} ${palette.bg} px-6 py-5 shadow-sm transition hover:shadow-md`}
                  >
                    <span className="text-xl font-semibold text-ink">{block.name}</span>
                    <span className="text-sm text-ink-soft">
                      {block._count.students} student
                      {block._count.students === 1 ? "" : "s"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
