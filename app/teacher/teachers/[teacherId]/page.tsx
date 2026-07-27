import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeacherNav } from "@/components/TeacherNav";
import { BlockManager } from "@/components/BlockManager";

export const dynamic = "force-dynamic";

export default async function TeacherPeriodsAdminPage({
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">{teacher.name}</h1>
          <Link
            href={`/teacher/teachers/${teacherId}/lessons`}
            className="rounded-full bg-cream-soft px-4 py-2 text-sm font-medium text-ink hover:bg-pastel-sky-bg"
          >
            Manage lessons
          </Link>
        </div>
        <BlockManager teacherId={teacherId} />
      </div>
    </div>
  );
}
