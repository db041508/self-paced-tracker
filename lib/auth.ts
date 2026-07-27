import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getTeacherSession } from "./session";

export async function isTeacher(): Promise<boolean> {
  const session = await getTeacherSession();
  return session.isTeacher === true;
}

export async function requireTeacherPage() {
  const session = await getTeacherSession();
  if (!session.isTeacher) {
    redirect("/teacher");
  }
}

export async function resolveStudentEditor(
  request: Request,
  studentId: string
): Promise<"teacher" | "student" | null> {
  if (await isTeacher()) return "teacher";

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const unlockSession = await prisma.unlockSession.findUnique({
    where: { token },
  });
  if (!unlockSession) return null;
  if (unlockSession.studentId !== studentId) return null;
  if (unlockSession.expiresAt < new Date()) return null;
  return "student";
}
