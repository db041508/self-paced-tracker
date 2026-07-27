import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeacherNav } from "@/components/TeacherNav";
import { LessonManager } from "@/components/LessonManager";

export const dynamic = "force-dynamic";

export default async function TeacherLessonsPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  await requireTeacherPage();
  const { teacherId } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) notFound();

  return (
    <div className="flex flex-1 flex-col bg-cream px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <TeacherNav />
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">{teacher.name} — Lessons</h1>
          <Link
            href={`/teacher/teachers/${teacherId}`}
            className="rounded-full bg-cream-soft px-4 py-2 text-sm font-medium text-ink hover:bg-pastel-sky-bg"
          >
            Periods
          </Link>
        </div>
        <p className="mb-6 text-sm text-ink-soft">
          Expand a lesson to choose which periods it applies to and edit its steps.
        </p>
        <LessonManager teacherId={teacherId} />
      </div>
    </div>
  );
}
