"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { PinModal } from "./PinModal";
import { StudentDetailPanel } from "./StudentDetailPanel";
import { pastelForIndex } from "@/lib/pastel";
import type { RosterDto, RosterStudent } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function VerticalTracker({
  blockId,
  isTeacher = false,
}: {
  blockId: string;
  isTeacher?: boolean;
}) {
  const { data, isLoading } = useSWR<RosterDto>(
    `/api/blocks/${blockId}/roster`,
    fetcher,
    { refreshInterval: 8000 }
  );

  const [pinModalStudent, setPinModalStudent] = useState<RosterStudent | null>(null);
  const [openStudent, setOpenStudent] = useState<{ id: string; name: string; token?: string } | null>(
    null
  );

  const bands = useMemo(() => {
    if (!data) return [];
    const groups: RosterStudent[][] = Array.from({ length: data.lessons.length + 1 }, () => []);
    for (const student of data.students) {
      groups[student.currentLessonIndex].push(student);
    }
    return groups;
  }, [data]);

  async function handlePinSubmit(pin: string): Promise<string | null> {
    if (!pinModalStudent) return null;
    const res = await fetch(`/api/students/${pinModalStudent.id}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return body?.error ?? "Incorrect code";
    }
    const body = await res.json();
    setOpenStudent({ id: pinModalStudent.id, name: pinModalStudent.name, token: body.token });
    setPinModalStudent(null);
    return null;
  }

  function handleNameClick(student: RosterStudent) {
    if (isTeacher) {
      setOpenStudent({ id: student.id, name: student.name });
    } else {
      setPinModalStudent(student);
    }
  }

  if (isLoading || !data) {
    return <p className="text-ink-soft">Loading tracker…</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.lessons.map((lesson, i) => {
          const palette = pastelForIndex(i);
          const students = bands[i] ?? [];
          return (
            <div
              key={lesson.id}
              className={`rounded-3xl border-2 ${palette.border} ${palette.bg} p-4 sm:p-5`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${palette.dot}`} />
                <h3 className="font-semibold text-ink">{lesson.title}</h3>
              </div>
              {students.length === 0 ? (
                <p className="text-sm text-ink-soft/70">No one here right now</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleNameClick(student)}
                      className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-white hover:shadow-md"
                    >
                      {student.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {bands[data.lessons.length]?.length > 0 && (
          <div className="rounded-3xl border-2 border-pastel-mint bg-pastel-mint-bg p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <h3 className="font-semibold text-ink">All lessons complete!</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {bands[data.lessons.length].map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleNameClick(student)}
                  className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-white hover:shadow-md"
                >
                  {student.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {pinModalStudent && (
        <PinModal
          studentName={pinModalStudent.name}
          onClose={() => setPinModalStudent(null)}
          onSubmit={handlePinSubmit}
        />
      )}

      {openStudent && (
        <StudentDetailPanel
          studentId={openStudent.id}
          studentName={openStudent.name}
          token={openStudent.token}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}
