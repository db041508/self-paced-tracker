import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function GET() {
  const blocks = await prisma.block.findMany({
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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.block.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "A block with that name already exists" }, { status: 409 });
  }

  const block = await prisma.block.create({ data: { name } });
  return NextResponse.json(block, { status: 201 });
}
