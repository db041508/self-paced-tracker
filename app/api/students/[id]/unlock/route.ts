import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { verifyPin } from "@/lib/pin";

const UNLOCK_TTL_MS = 10 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const valid = await verifyPin(pin, student.pinHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + UNLOCK_TTL_MS);
  const session = await prisma.unlockSession.create({
    data: { studentId: id, token: nanoid(), expiresAt },
  });

  return NextResponse.json({ token: session.token, expiresAt });
}
