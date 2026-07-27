import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { generatePin, hashPin, isValidPinFormat } from "@/lib/pin";

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const blockId = typeof body?.blockId === "string" ? body.blockId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const requestedPin = typeof body?.pin === "string" ? body.pin.trim() : "";

  if (!blockId || !name) {
    return NextResponse.json({ error: "blockId and name are required" }, { status: 400 });
  }
  if (requestedPin && !isValidPinFormat(requestedPin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
  }

  const block = await prisma.block.findUnique({ where: { id: blockId } });
  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const dupe = await prisma.student.findFirst({
    where: { blockId, name: { equals: name } },
  });
  if (dupe) {
    return NextResponse.json(
      { error: "A student with that name already exists in this block" },
      { status: 409 }
    );
  }

  const pin = requestedPin || generatePin();
  const pinHash = await hashPin(pin);

  const student = await prisma.student.create({
    data: { blockId, name, pinHash },
  });

  return NextResponse.json({ ...student, pin }, { status: 201 });
}
