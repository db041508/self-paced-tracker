import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");

  const blocks = await prisma.block.findMany({
    where: teacherId ? { teacherId } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });
  return NextResponse.json(blocks);
}

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!teacherId || !name) {
    return NextResponse.json({ error: "teacherId and name are required" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const existing = await prisma.block.findUnique({
    where: { teacherId_name: { teacherId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: "A block with that name already exists" }, { status: 409 });
  }

  const block = await prisma.block.create({ data: { teacherId, name } });
  return NextResponse.json(block, { status: 201 });
}
