import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveStudentEditor } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const { id, subtaskId } = await params;

  const editor = await resolveStudentEditor(request, id);
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.completed !== "boolean") {
    return NextResponse.json({ error: "completed must be a boolean" }, { status: 400 });
  }
  const completed: boolean = body.completed;

  const completion = await prisma.subtaskCompletion.upsert({
    where: { studentId_subtaskId: { studentId: id, subtaskId } },
    update: { completed, completedAt: completed ? new Date() : null, updatedBy: editor },
    create: {
      studentId: id,
      subtaskId,
      completed,
      completedAt: completed ? new Date() : null,
      updatedBy: editor,
    },
  });

  return NextResponse.json(completion);
}
