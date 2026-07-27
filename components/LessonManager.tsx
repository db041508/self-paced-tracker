"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { pastelForIndex } from "@/lib/pastel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Subtask = { id: string; title: string; position: number };
type Lesson = {
  id: string;
  title: string;
  position: number;
  subtasks: Subtask[];
  blockIds: string[];
};
type BlockOption = { id: string; name: string };

export function LessonManager({ teacherId }: { teacherId: string }) {
  const { data, mutate, isLoading } = useSWR<Lesson[]>(
    `/api/lessons?teacherId=${teacherId}`,
    fetcher
  );
  const { data: blocks } = useSWR<BlockOption[]>(
    `/api/blocks?teacherId=${teacherId}`,
    fetcher
  );
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function addLesson(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, title }),
    });
    setNewTitle("");
    mutate();
  }

  async function saveEdit(id: string) {
    const title = editValue.trim();
    if (!title) return;
    await fetch(`/api/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditingId(null);
    mutate();
  }

  async function deleteLesson(id: string, title: string) {
    if (!confirm(`Delete "${title}"? Progress for this lesson will be removed for all students.`)) {
      return;
    }
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    mutate();
  }

  async function move(index: number, direction: -1 | 1) {
    if (!data) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    const ids = data.map((l) => l.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

    await mutate(
      fetch("/api/lessons/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, orderedIds: ids }),
      }).then((r) => r.json()),
      {
        optimisticData: ids.map((id, i) => {
          const lesson = data.find((l) => l.id === id)!;
          return { ...lesson, position: i };
        }),
        revalidate: false,
      }
    );
  }

  async function toggleBlock(lessonId: string, blockId: string, included: boolean) {
    await fetch(`/api/lessons/${lessonId}/blocks/${blockId}`, {
      method: included ? "POST" : "DELETE",
    });
    mutate();
  }

  if (isLoading || !data) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  return (
    <div>
      <form onSubmit={addLesson} className="mb-6 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New lesson title"
          className="flex-1 rounded-xl border-2 border-cream-soft bg-white px-4 py-2 text-ink focus:border-pastel-sky focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-pastel-sky px-5 py-2 text-sm font-semibold text-ink hover:opacity-90"
        >
          Add lesson
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {data.map((lesson, index) => {
          const palette = pastelForIndex(index);
          const isExpanded = expandedId === lesson.id;
          return (
            <div
              key={lesson.id}
              className={`rounded-2xl border-2 ${palette.border} ${palette.bg} p-4`}
            >
              <div className="flex items-center justify-between gap-3">
                {editingId === lesson.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded-lg border-2 border-cream-soft px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => saveEdit(lesson.id)}
                      className="text-sm font-medium text-ink"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-ink-soft">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lesson.id)}
                    className="flex-1 text-left font-semibold text-ink"
                  >
                    {lesson.title}{" "}
                    <span className="text-sm font-normal text-ink-soft">
                      ({lesson.subtasks.length} step{lesson.subtasks.length === 1 ? "" : "s"})
                    </span>
                  </button>
                )}

                <div className="flex shrink-0 gap-1 text-sm">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-full bg-white/70 px-2.5 py-1.5 font-medium text-ink disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === data.length - 1}
                    className="rounded-full bg-white/70 px-2.5 py-1.5 font-medium text-ink disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(lesson.id);
                      setEditValue(lesson.title);
                    }}
                    className="rounded-full bg-white/70 px-3 py-1.5 font-medium text-ink"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteLesson(lesson.id, lesson.title)}
                    className="rounded-full bg-white/70 px-3 py-1.5 font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isExpanded && (
                <>
                  {blocks && blocks.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/60 pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Include in:
                      </span>
                      {blocks.map((block) => {
                        const included = lesson.blockIds.includes(block.id);
                        return (
                          <label
                            key={block.id}
                            className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-sm text-ink"
                          >
                            <input
                              type="checkbox"
                              checked={included}
                              onChange={(e) => toggleBlock(lesson.id, block.id, e.target.checked)}
                              className="h-4 w-4 rounded accent-pastel-mint"
                            />
                            {block.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <SubtaskEditor
                    lessonId={lesson.id}
                    subtasks={lesson.subtasks}
                    onChange={() => mutate()}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubtaskEditor({
  lessonId,
  subtasks,
  onChange,
}: {
  lessonId: string;
  subtasks: Subtask[];
  onChange: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function addSubtask(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    await fetch(`/api/lessons/${lessonId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setNewTitle("");
    onChange();
  }

  async function saveEdit(subtaskId: string) {
    const title = editValue.trim();
    if (!title) return;
    await fetch(`/api/lessons/${lessonId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditingId(null);
    onChange();
  }

  async function deleteSubtask(subtaskId: string, title: string) {
    if (!confirm(`Remove step "${title}"?`)) return;
    await fetch(`/api/lessons/${lessonId}/subtasks/${subtaskId}`, { method: "DELETE" });
    onChange();
  }

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subtasks.length) return;
    const ids = subtasks.map((s) => s.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    await fetch(`/api/lessons/${lessonId}/subtasks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    onChange();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-white/60 pt-3">
      {subtasks.map((subtask, index) => (
        <div
          key={subtask.id}
          className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2"
        >
          {editingId === subtask.id ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 rounded-lg border-2 border-cream-soft px-2 py-1 text-sm"
              />
              <button
                onClick={() => saveEdit(subtask.id)}
                className="text-sm font-medium text-ink"
              >
                Save
              </button>
              <button onClick={() => setEditingId(null)} className="text-sm text-ink-soft">
                Cancel
              </button>
            </div>
          ) : (
            <span className="text-sm text-ink">{subtask.title}</span>
          )}
          <div className="flex shrink-0 gap-1 text-xs">
            <button
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="rounded-full bg-cream px-2 py-1 font-medium text-ink disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index === subtasks.length - 1}
              className="rounded-full bg-cream px-2 py-1 font-medium text-ink disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              onClick={() => {
                setEditingId(subtask.id);
                setEditValue(subtask.title);
              }}
              className="rounded-full bg-cream px-2 py-1 font-medium text-ink"
            >
              Rename
            </button>
            <button
              onClick={() => deleteSubtask(subtask.id, subtask.title)}
              className="rounded-full bg-cream px-2 py-1 font-medium text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={addSubtask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New step (e.g. Mastery)"
          className="flex-1 rounded-lg border-2 border-cream-soft bg-white px-3 py-1.5 text-sm focus:border-pastel-sky focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-sm"
        >
          Add step
        </button>
      </form>
    </div>
  );
}
