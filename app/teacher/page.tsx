import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/session";
import { TeacherLoginForm } from "@/components/TeacherLoginForm";

export default async function TeacherLoginPage() {
  const session = await getTeacherSession();
  if (session.isTeacher) {
    redirect("/teacher/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-cream px-6">
      <TeacherLoginForm />
    </div>
  );
}
