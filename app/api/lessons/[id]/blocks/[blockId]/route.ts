import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

async function verifyMatchingTeacher(lessonId: string, blockId: string) {
  const [lesson, block] = await Promise.all([
    prisma.lesson.findUnique({ where: { id: lessonId } }),
    prisma.block.findUnique({ where: { id: blockId } }),
  ]);
  if (!lesson || !block) return { error: "Lesson or block not found", status: 404 as const };
  if (lesson.teacherId !== block.teacherId) {
    return { error: "Lesson and block belong to different teachers", status: 400 as const };
  }
  return { lesson, block };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: lessonId, blockId } = await params;

  const check = await verifyMatchingTeacher(lessonId, blockId);
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const link = await prisma.lessonBlock.upsert({
    where: { lessonId_blockId: { lessonId, blockId } },
    update: {},
    create: { lessonId, blockId },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: lessonId, blockId } = await params;

  await prisma.lessonBlock.deleteMany({ where: { lessonId, blockId } });
  return NextResponse.json({ ok: true });
}
