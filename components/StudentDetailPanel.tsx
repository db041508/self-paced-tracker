"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { CelebrationBurst } from "./CelebrationBurst";
import { pastelForIndex } from "@/lib/pastel";
import type { StudentDetailDto } from "@/lib/types";

function authFetcher(token?: string) {
  return (url: string) =>
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    });
}

export function StudentDetailPanel({
  studentId,
  studentName,
  token,
  onClose,
}: {
  studentId: string;
  studentName: string;
  token?: string;
  onClose: () => void;
}) {
  const { data, mutate, error } = useSWR<StudentDetailDto>(
    `/api/students/${studentId}/detail`,
    authFetcher(token)
  );

  const [expandedOverride, setExpandedOverride] = useState<Set<string> | null>(null);
  const [burstId, setBurstId] = useState(0);

  const currentLessonId = useMemo(() => {
    if (!data) return null;
    const firstIncomplete = data.lessons.find((l) => l.subtasks.some((s) => !s.completed));
    return firstIncomplete?.id ?? data.lessons[data.lessons.length - 1]?.id ?? null;
  }, [data]);

  const defaultExpanded = useMemo(
    () => new Set(currentLessonId ? [currentLessonId] : []),
    [currentLessonId]
  );
  const expanded = expandedOverride ?? defaultExpanded;

  function toggleExpanded(lessonId: string) {
    setExpandedOverride((prev) => {
      const next = new Set(prev ?? defaultExpanded);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }

  async function toggleSubtask(subtaskId: string, next: boolean) {
    if (!data) return;
    const current = data;

    const applyToggle = (detail: StudentDetailDto): StudentDetailDto => ({
      ...detail,
      lessons: detail.lessons.map((l) => ({
        ...l,
        subtasks: l.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: next } : s)),
      })),
    });

    await mutate(
      async () => {
        const res = await fetch(`/api/students/${studentId}/subtasks/${subtaskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ completed: next }),
        });
        if (!res.ok) return current;
        return applyToggle(current);
      },
      { optimisticData: applyToggle(current), revalidate: false }
    );

    if (next) {
      setBurstId((n) => n + 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">{studentName}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-cream-soft px-4 py-2 text-sm font-medium text-ink hover:bg-pastel-pink-bg"
          >
            Done
          </button>
        </div>

        {error && <p className="text-sm text-red-600">Couldn&apos;t load progress.</p>}
        {!data && !error && <p className="text-sm text-ink-soft">Loading…</p>}

        {data && (
          <div className="flex flex-col gap-3">
            {data.lessons.map((lesson, i) => {
              const palette = pastelForIndex(i);
              const isOpen = expanded.has(lesson.id);
              const completedCount = lesson.subtasks.filter((s) => s.completed).length;
              return (
                <div
                  key={lesson.id}
                  className={`rounded-2xl border-2 ${palette.border} ${palette.bg} overflow-hidden`}
                >
                  <button
                    onClick={() => toggleExpanded(lesson.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="font-semibold text-ink">{lesson.title}</span>
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      {completedCount}/{lesson.subtasks.length}
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                        ⌄
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-2 px-4 pb-4">
                      {lesson.subtasks.map((subtask) => (
                        <label
                          key={subtask.id}
                          className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={(e) => toggleSubtask(subtask.id, e.target.checked)}
                            className="h-5 w-5 rounded accent-pastel-mint"
                          />
                          <span className="text-ink">{subtask.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {burstId > 0 && <CelebrationBurst key={burstId} />}
    </div>
  );
}
