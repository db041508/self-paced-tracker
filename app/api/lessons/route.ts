import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { DEFAULT_SUBTASK_TITLES } from "@/lib/constants";

export async function GET() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });
  return NextResponse.json(lessons);
}

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const count = await prisma.lesson.count();
  const lesson = await prisma.lesson.create({
    data: {
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

  return NextResponse.json(lesson, { status: 201 });
}
