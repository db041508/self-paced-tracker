import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function GET() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { blocks: true } } },
  });
  return NextResponse.json(teachers);
}

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.teacher.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "A teacher with that name already exists" }, { status: 409 });
  }

  const teacher = await prisma.teacher.create({ data: { name } });
  return NextResponse.json(teacher, { status: 201 });
}
