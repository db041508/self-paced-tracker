import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { DEFAULT_SUBTASK_TITLES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");
  if (!teacherId) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { teacherId },
    orderBy: { position: "asc" },
    include: {
      subtasks: { orderBy: { position: "asc" } },
      blocks: { select: { blockId: true } },
    },
  });

  return NextResponse.json(
    lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      position: lesson.position,
      subtasks: lesson.subtasks,
      blockIds: lesson.blocks.map((b) => b.blockId),
    }))
  );
}

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!teacherId || !title) {
    return NextResponse.json({ error: "teacherId and title are required" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const count = await prisma.lesson.count({ where: { teacherId } });
  const lesson = await prisma.lesson.create({
    data: {
      teacherId,
      title,
      position: count,
      subtasks: {
        create: DEFAULT_SUBTASK_TITLES.map((subtaskTitle, i) => ({
          title: subtaskTitle,
          position: i,
        })),
      },
    },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ ...lesson, blockIds: [] }, { status: 201 });
}
