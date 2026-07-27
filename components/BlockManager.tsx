"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type BlockRow = {
  id: string;
  name: string;
  _count: { students: number };
};

export function BlockManager() {
  const { data, mutate, isLoading } = useSWR<BlockRow[]>("/api/blocks", fetcher);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function addBlock(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not add block");
      return;
    }
    setNewName("");
    mutate();
  }

  async function renameBlock(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    await fetch(`/api/blocks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setRenamingId(null);
    mutate();
  }

  async function deleteBlock(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all of its students? This cannot be undone.`)) {
      return;
    }
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <form onSubmit={addBlock} className="mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New block name (e.g. Period 3)"
          className="flex-1 rounded-xl border-2 border-cream-soft bg-white px-4 py-2 text-ink focus:border-pastel-sky focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-pastel-sky px-5 py-2 text-sm font-semibold text-ink hover:opacity-90"
        >
          Add block
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-ink-soft">No blocks yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((block) => (
            <li
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-cream-soft bg-white px-4 py-3"
            >
              <div>
                {renamingId === block.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="rounded-lg border-2 border-cream-soft px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => renameBlock(block.id)}
                      className="text-sm font-medium text-ink"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-sm text-ink-soft"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-ink">{block.name}</p>
                    <p className="text-sm text-ink-soft">{block._count.students} students</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Link
                  href={`/teacher/blocks/${block.id}`}
                  className="rounded-full bg-cream-soft px-3 py-1.5 font-medium text-ink hover:bg-pastel-sky-bg"
                >
                  Tracker
                </Link>
                <Link
                  href={`/teacher/blocks/${block.id}/roster`}
                  className="rounded-full bg-cream-soft px-3 py-1.5 font-medium text-ink hover:bg-pastel-sky-bg"
                >
                  Roster
                </Link>
                <button
                  onClick={() => {
                    setRenamingId(block.id);
                    setRenameValue(block.name);
                  }}
                  className="rounded-full bg-cream-soft px-3 py-1.5 font-medium text-ink hover:bg-pastel-sky-bg"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteBlock(block.id, block.name)}
                  className="rounded-full bg-pastel-pink-bg px-3 py-1.5 font-medium text-pastel-pink"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
