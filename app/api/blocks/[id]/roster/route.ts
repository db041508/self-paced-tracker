import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const block = await prisma.block.findUnique({ where: { id } });
  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { blocks: { some: { blockId: id } } },
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });

  const students = await prisma.student.findMany({
    where: { blockId: id },
    include: { completions: { where: { completed: true }, select: { subtaskId: true } } },
  });

  const roster = students.map((student) => {
    const completedSubtaskIds = new Set(student.completions.map((c) => c.subtaskId));

    let currentLessonIndex = lessons.length;
    let completedInLesson = 0;
    let totalInLesson = 0;
    let totalCompleted = 0;
    let totalSubtasks = 0;
    let foundCurrent = false;

    for (let i = 0; i < lessons.length; i++) {
      const subtasks = lessons[i].subtasks;
      const completedHere = subtasks.filter((s) => completedSubtaskIds.has(s.id)).length;
      totalCompleted += completedHere;
      totalSubtasks += subtasks.length;

      if (!foundCurrent && completedHere < subtasks.length) {
        currentLessonIndex = i;
        completedInLesson = completedHere;
        totalInLesson = subtasks.length;
        foundCurrent = true;
      }
    }

    return {
      id: student.id,
      name: student.name,
      currentLessonIndex,
      completedInLesson,
      totalInLesson,
      totalCompleted,
      totalSubtasks,
    };
  });

  roster.sort((a, b) => {
    if (a.currentLessonIndex !== b.currentLessonIndex) {
      return a.currentLessonIndex - b.currentLessonIndex;
    }
    if (a.completedInLesson !== b.completedInLesson) {
      return a.completedInLesson - b.completedInLesson;
    }
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    block: { id: block.id, name: block.name },
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      subtaskCount: l.subtasks.length,
    })),
    students: roster,
  });
}
