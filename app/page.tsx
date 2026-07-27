import Link from "next/link";
import { prisma } from "@/lib/db";
import { pastelForIndex } from "@/lib/pastel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { blocks: true } } },
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-cream px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Class Progress Tracker</h1>
          <Link
            href="/teacher"
            className="text-sm font-medium text-ink-soft underline-offset-4 hover:underline"
          >
            Teacher
          </Link>
        </div>

        {teachers.length === 0 ? (
          <p className="text-ink-soft">
            No teachers have been set up yet. Add one from the{" "}
            <Link href="/teacher" className="underline">
              teacher view
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="mb-6 text-ink-soft">Pick your teacher to see their classes.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {teachers.map((teacher, i) => {
                const palette = pastelForIndex(i);
                return (
                  <Link
                    key={teacher.id}
                    href={`/teachers/${teacher.id}`}
                    className={`flex min-h-24 flex-col justify-center rounded-3xl border-2 ${palette.border} ${palette.bg} px-6 py-5 shadow-sm transition hover:shadow-md`}
                  >
                    <span className="text-xl font-semibold text-ink">{teacher.name}</span>
                    <span className="text-sm text-ink-soft">
                      {teacher._count.blocks} period
                      {teacher._count.blocks === 1 ? "" : "s"}
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
