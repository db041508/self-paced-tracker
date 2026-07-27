"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";

type PreviewRow = {
  rowNumber: number;
  name: string;
  block: string;
  pin?: string;
  valid: boolean;
  reason?: string;
};

type ImportResult = {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: { row: number; reason: string }[];
  generatedPins: { name: string; block: string; pin: string }[];
};

const PIN_RE = /^\d{4}$/;

function pickField(record: Record<string, string>, keys: string[]): string {
  const lowerMap = new Map(Object.keys(record).map((k) => [k.trim().toLowerCase(), k]));
  for (const key of keys) {
    const actualKey = lowerMap.get(key);
    if (actualKey !== undefined) return (record[actualKey] ?? "").trim();
  }
  return "";
}

function buildPreview(records: Record<string, string>[]): PreviewRow[] {
  const seen = new Set<string>();
  return records.map((record, index) => {
    const rowNumber = index + 2; // account for header row
    const name = pickField(record, ["name"]);
    const block = pickField(record, ["block"]);
    const pin = pickField(record, ["pin"]);

    if (!name) return { rowNumber, name, block, pin, valid: false, reason: "Missing name" };
    if (!block) return { rowNumber, name, block, pin, valid: false, reason: "Missing block" };
    if (pin && !PIN_RE.test(pin)) {
      return { rowNumber, name, block, pin, valid: false, reason: "PIN must be 4 digits" };
    }

    const identity = `${block.toLowerCase()}::${name.toLowerCase()}`;
    if (seen.has(identity)) {
      return { rowNumber, name, block, pin, valid: false, reason: "Duplicate row in file" };
    }
    seen.add(identity);

    return { rowNumber, name, block, pin: pin || undefined, valid: true };
  });
}

export function CsvImportForm() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setParseError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          return;
        }
        setPreview(buildPreview(results.data));
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function confirmImport() {
    if (!preview) return;
    const validRows = preview.filter((r) => r.valid);
    setSubmitting(true);
    const res = await fetch("/api/roster/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: validRows }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setResult(body);
      setPreview(null);
    } else {
      setParseError(body?.error ?? "Import failed");
    }
  }

  const validCount = preview?.filter((r) => r.valid).length ?? 0;
  const errorCount = preview ? preview.length - validCount : 0;

  return (
    <div>
      <div className="mb-6 rounded-2xl border-2 border-cream-soft bg-white p-4 text-sm text-ink-soft">
        <p className="mb-1 font-semibold text-ink">CSV format</p>
        <p>
          Columns (any order, case-insensitive): <code>name</code>, <code>block</code>,{" "}
          <code>pin</code> (optional). If a PIN is left blank, one will be generated for you.
          Re-uploading the same file is safe — existing students without a PIN in the row are
          left untouched.
        </p>
      </div>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="mb-4 block text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-pastel-sky file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink"
      />

      {parseError && <p className="mb-4 text-sm text-red-600">{parseError}</p>}

      {preview && (
        <div>
          <p className="mb-3 text-sm text-ink-soft">
            {validCount} row{validCount === 1 ? "" : "s"} ready to import
            {errorCount > 0 ? `, ${errorCount} with errors (will be skipped)` : ""}.
          </p>
          <div className="mb-4 max-h-96 overflow-y-auto rounded-2xl border-2 border-cream-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-cream-soft">
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Block</th>
                  <th className="px-3 py-2 text-left">PIN</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.rowNumber} className={row.valid ? "" : "bg-pastel-pink-bg"}>
                    <td className="px-3 py-2 text-ink-soft">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.name || "—"}</td>
                    <td className="px-3 py-2">{row.block || "—"}</td>
                    <td className="px-3 py-2">{row.pin || "auto"}</td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="text-pastel-mint">OK</span>
                      ) : (
                        <span className="text-red-600">{row.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={confirmImport}
            disabled={submitting || validCount === 0}
            className="rounded-xl bg-pastel-sky px-5 py-2 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {submitting ? "Importing…" : `Confirm import (${validCount} rows)`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border-2 border-cream-soft bg-white p-5">
          <h2 className="mb-2 text-lg font-semibold text-ink">Import complete</h2>
          <p className="mb-4 text-sm text-ink-soft">
            {result.createdCount} created · {result.updatedCount} PIN
            {result.updatedCount === 1 ? "" : "s"} reset · {result.skippedCount} unchanged
            {result.errors.length > 0 ? ` · ${result.errors.length} errors` : ""}
          </p>

          {result.generatedPins.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 font-medium text-ink">New PINs to distribute:</p>
              <div className="max-h-72 overflow-y-auto rounded-xl border-2 border-cream-soft">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-cream-soft">
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Block</th>
                      <th className="px-3 py-2 text-left">PIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.generatedPins.map((p) => (
                      <tr key={`${p.block}-${p.name}`}>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2">{p.block}</td>
                        <td className="px-3 py-2 font-semibold text-pastel-mint">{p.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="mb-2 font-medium text-ink">Errors:</p>
              <ul className="list-inside list-disc text-sm text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
