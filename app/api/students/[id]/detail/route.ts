import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveStudentEditor } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const editor = await resolveStudentEditor(request, id);
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { completions: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const lessons = await prisma.lesson.findMany({
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });

  const completedSubtaskIds = new Set(
    student.completions.filter((c) => c.completed).map((c) => c.subtaskId)
  );

  return NextResponse.json({
    student: { id: student.id, name: student.name },
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      subtasks: lesson.subtasks.map((s) => ({
        id: s.id,
        title: s.title,
        completed: completedSubtaskIds.has(s.id),
      })),
    })),
  });
}
