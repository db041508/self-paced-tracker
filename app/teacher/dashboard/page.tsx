import { requireTeacherPage } from "@/lib/auth";
import { TeacherNav } from "@/components/TeacherNav";
import { TeacherManager } from "@/components/TeacherManager";

export default async function TeacherDashboardPage() {
  await requireTeacherPage();

  return (
    <div className="flex flex-1 flex-col bg-cream px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <TeacherNav />
        <h1 className="mb-6 text-2xl font-bold text-ink">Teachers</h1>
        <TeacherManager />
      </div>
    </div>
  );
}
