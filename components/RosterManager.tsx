"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";
import type { RosterDto } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RosterManager({ blockId }: { blockId: string }) {
  const { data, mutate, isLoading } = useSWR<RosterDto>(
    `/api/blocks/${blockId}/roster`,
    fetcher
  );
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const students = useMemo(
    () => [...(data?.students ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  async function addStudent(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId, name, pin: newPin.trim() || undefined }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body?.error ?? "Could not add student");
      return;
    }
    setRevealedPins((prev) => ({ ...prev, [body.id]: body.pin }));
    setNewName("");
    setNewPin("");
    mutate();
  }

  async function saveEdit(id: string) {
    const name = editValue.trim();
    if (!name) return;
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setEditingId(null);
    mutate();
  }

  async function resetPin(id: string) {
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPin: true }),
    });
    const body = await res.json();
    if (res.ok) {
      setRevealedPins((prev) => ({ ...prev, [id]: body.pin }));
    }
  }

  async function deleteStudent(id: string, name: string) {
    if (!confirm(`Remove ${name} from this block? This cannot be undone.`)) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    mutate();
  }

  if (isLoading || !data) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  return (
    <div>
      <form onSubmit={addStudent} className="mb-6 flex flex-wrap gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Student name"
          className="flex-1 rounded-xl border-2 border-cream-soft bg-white px-4 py-2 text-ink focus:border-pastel-sky focus:outline-none"
        />
        <input
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="PIN (optional)"
          inputMode="numeric"
          className="w-36 rounded-xl border-2 border-cream-soft bg-white px-4 py-2 text-ink focus:border-pastel-sky focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-pastel-sky px-5 py-2 text-sm font-semibold text-ink hover:opacity-90"
        >
          Add student
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2">
        {students.map((student) => (
          <li
            key={student.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-cream-soft bg-white px-4 py-3"
          >
            <div>
              {editingId === student.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded-lg border-2 border-cream-soft px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => saveEdit(student.id)}
                    className="text-sm font-medium text-ink"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-ink-soft">
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="font-medium text-ink">{student.name}</p>
              )}
              <p className="text-xs text-ink-soft">
                {student.totalCompleted}/{student.totalSubtasks} steps complete
              </p>
              {revealedPins[student.id] && (
                <p className="mt-1 text-sm font-semibold text-pastel-mint">
                  PIN: {revealedPins[student.id]}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                onClick={() => {
                  setEditingId(student.id);
                  setEditValue(student.name);
                }}
                className="rounded-full bg-cream-soft px-3 py-1.5 font-medium text-ink"
              >
                Rename
              </button>
              <button
                onClick={() => resetPin(student.id)}
                className="rounded-full bg-cream-soft px-3 py-1.5 font-medium text-ink"
              >
                Reset PIN
              </button>
              <button
                onClick={() => deleteStudent(student.id, student.name)}
                className="rounded-full bg-pastel-pink-bg px-3 py-1.5 font-medium text-pastel-pink"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
