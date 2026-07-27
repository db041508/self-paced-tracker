import { NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/session";

export async function POST() {
  const session = await getTeacherSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
