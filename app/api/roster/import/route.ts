import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { generatePin, hashPin, isValidPinFormat } from "@/lib/pin";

type InputRow = {
  rowNumber: number;
  name: string;
  block: string;
  pin?: string;
};

export async function POST(request: Request) {
  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rows: unknown = body?.rows;
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  const errors: { row: number; reason: string }[] = [];
  const generatedPins: { name: string; block: string; pin: string }[] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const validRows: InputRow[] = [];
  const seenInFile = new Set<string>();

  for (const raw of rows as Record<string, unknown>[]) {
    const rowNumber = typeof raw?.rowNumber === "number" ? raw.rowNumber : validRows.length + 1;
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    const block = typeof raw?.block === "string" ? raw.block.trim() : "";
    const pin = typeof raw?.pin === "string" ? raw.pin.trim() : "";

    if (!name) {
      errors.push({ row: rowNumber, reason: "Missing name" });
      continue;
    }
    if (!block) {
      errors.push({ row: rowNumber, reason: "Missing block" });
      continue;
    }
    if (pin && !isValidPinFormat(pin)) {
      errors.push({ row: rowNumber, reason: `PIN "${pin}" must be exactly 4 digits` });
      continue;
    }

    const identity = `${block.toLowerCase()}::${name.toLowerCase()}`;
    if (seenInFile.has(identity)) {
      errors.push({ row: rowNumber, reason: "Duplicate row in file" });
      continue;
    }
    seenInFile.add(identity);

    validRows.push({ rowNumber, name, block, pin: pin || undefined });
  }

  const blockCache = new Map<string, { id: string; name: string }>();
  const existingBlocks = await prisma.block.findMany();
  for (const b of existingBlocks) {
    blockCache.set(b.name.toLowerCase(), { id: b.id, name: b.name });
  }

  for (const row of validRows) {
    let block = blockCache.get(row.block.toLowerCase());
    if (!block) {
      const created = await prisma.block.create({ data: { name: row.block } });
      block = { id: created.id, name: created.name };
      blockCache.set(row.block.toLowerCase(), block);
    }

    const existingStudent = await prisma.student.findFirst({
      where: { blockId: block.id, name: { equals: row.name } },
    });

    if (existingStudent) {
      if (row.pin) {
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: { pinHash: await hashPin(row.pin) },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    const pin = row.pin ?? generatePin();
    await prisma.student.create({
      data: { blockId: block.id, name: row.name, pinHash: await hashPin(pin) },
    });
    createdCount++;
    if (!row.pin) {
      generatedPins.push({ name: row.name, block: block.name, pin });
    }
  }

  return NextResponse.json({
    createdCount,
    updatedCount,
    skippedCount,
    errors,
    generatedPins,
  });
}
