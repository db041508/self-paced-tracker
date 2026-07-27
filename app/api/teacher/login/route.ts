import { NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const passcode = body?.passcode;

  if (typeof passcode !== "string" || passcode !== process.env.TEACHER_PASSCODE) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const session = await getTeacherSession();
  session.isTeacher = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
