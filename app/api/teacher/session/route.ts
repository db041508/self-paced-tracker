import { NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/session";

export async function GET() {
  const session = await getTeacherSession();
  return NextResponse.json({ isTeacher: session.isTeacher === true });
}
