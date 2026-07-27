import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { subtaskId } = await params;

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { title },
  });

  return NextResponse.json(subtask);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: lessonId, subtaskId } = await params;

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.subtask.delete({ where: { id: subtaskId } });
    await tx.subtask.updateMany({
      where: { lessonId, position: { gt: subtask.position } },
      data: { position: { decrement: 1 } },
    });
  });

  return NextResponse.json({ ok: true });
}
