import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";
  const orderedIds: unknown = body?.orderedIds;
  if (!teacherId) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
  }
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "orderedIds must be a string array" }, { status: 400 });
  }

  const existing = await prisma.lesson.findMany({ where: { teacherId }, select: { id: true } });
  const existingIds = new Set(existing.map((l) => l.id));
  const providedIds = new Set(orderedIds as string[]);

  if (
    existingIds.size !== providedIds.size ||
    ![...existingIds].every((id) => providedIds.has(id))
  ) {
    return NextResponse.json(
      { error: "orderedIds must contain exactly the current set of lesson ids" },
      { status: 400 }
    );
  }

  const ids = orderedIds as string[];
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.lesson.update({ where: { id: ids[i] }, data: { position: -(i + 1) } });
    }
    for (let i = 0; i < ids.length; i++) {
      await tx.lesson.update({ where: { id: ids[i] }, data: { position: i } });
    }
  });

  const lessons = await prisma.lesson.findMany({
    where: { teacherId },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(lessons);
}
