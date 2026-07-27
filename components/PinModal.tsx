"use client";

import { useState, type FormEvent } from "react";

export function PinModal({
  studentName,
  onSubmit,
  onClose,
}: {
  studentName: string;
  onSubmit: (pin: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("Enter your 4-digit code");
      return;
    }
    setSubmitting(true);
    const err = await onSubmit(pin);
    setSubmitting(false);
    if (err) {
      setError(err);
      setPin("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-3xl bg-cream p-6 shadow-xl"
      >
        <h2 className="mb-1 text-lg font-semibold text-ink">{studentName}</h2>
        <p className="mb-4 text-sm text-ink-soft">Enter your 4-digit code</p>
        <input
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(null);
          }}
          className="mb-2 w-full rounded-xl border-2 border-cream-soft bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink focus:border-pastel-sky focus:outline-none"
          placeholder="••••"
        />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-cream-soft py-3 text-sm font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-pastel-mint py-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}
