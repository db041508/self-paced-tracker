import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  isTeacher?: boolean;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "tracker_teacher_session",
  ttl: 60 * 60 * 12,
  cookieOptions: {
    secure: false,
    sameSite: "lax",
  },
};

export async function getTeacherSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
