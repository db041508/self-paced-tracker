"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/teacher/dashboard", label: "Blocks" },
  { href: "/teacher/lessons", label: "Lessons" },
  { href: "/teacher/roster/import", label: "Import Roster" },
];

export function TeacherNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-cream-soft pb-4">
      <nav className="flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                active
                  ? "bg-pastel-sky text-ink"
                  : "bg-cream-soft text-ink hover:bg-pastel-sky-bg"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-ink-soft hover:underline">
          View student site
        </Link>
        <button
          onClick={logout}
          className="rounded-full border-2 border-cream-soft px-4 py-2 text-sm font-medium text-ink hover:bg-cream-soft"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
