import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { generatePin, hashPin, isValidPinFormat } from "@/lib/pin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const data: { name?: string; pinHash?: string } = {};
  let newPin: string | undefined;

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }

  if (body?.resetPin) {
    newPin = generatePin();
    data.pinHash = await hashPin(newPin);
  } else if (typeof body?.pin === "string" && body.pin.trim()) {
    const pin = body.pin.trim();
    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }
    newPin = pin;
    data.pinHash = await hashPin(pin);
  }

  const student = await prisma.student.update({ where: { id }, data });

  return NextResponse.json({
    id: student.id,
    name: student.name,
    blockId: student.blockId,
    pin: newPin,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
