import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const data: { name?: string } = {};

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }

  const block = await prisma.block.update({ where: { id }, data });
  return NextResponse.json(block);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await prisma.block.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
