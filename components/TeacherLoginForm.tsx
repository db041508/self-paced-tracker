"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function TeacherLoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Incorrect passcode");
      return;
    }
    router.push("/teacher/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xs rounded-3xl border-2 border-cream-soft bg-white p-6 shadow-sm"
    >
      <h1 className="mb-1 text-xl font-semibold text-ink">Teacher sign in</h1>
      <p className="mb-4 text-sm text-ink-soft">
        Enter the teacher passcode to manage this tracker.
      </p>
      <input
        autoFocus
        type="password"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="mb-3 w-full rounded-xl border-2 border-cream-soft px-4 py-3 text-center text-lg text-ink focus:border-pastel-sky focus:outline-none"
        placeholder="Passcode"
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !passcode}
        className="w-full rounded-xl bg-pastel-sky py-3 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
