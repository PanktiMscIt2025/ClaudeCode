"use client";

import { useId, useRef, useState } from "react";
import { cn, formatBytes } from "@/lib/format";

/** Accessible file picker with drag-and-drop and client-side extension/size checks. */
export function FileDrop({
  accept,
  maxBytes,
  hint,
  onFile,
}: {
  accept: string[]; // e.g. [".xlsx", ".xls"]
  maxBytes: number;
  hint?: string;
  onFile: (file: File | null) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function choose(f: File | undefined) {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!accept.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${accept.join(", ")}`);
      return reset();
    }
    if (f.size > maxBytes) {
      setError(`File is too large (${formatBytes(f.size)}). Maximum is ${formatBytes(maxBytes)}.`);
      return reset();
    }
    setError(null);
    setFile(f);
    onFile(f);
  }

  function reset() {
    setFile(null);
    onFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center",
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white hover:border-slate-400",
        )}
      >
        {file ? (
          <>
            <span className="text-sm font-medium text-slate-900">{file.name}</span>
            <span className="text-xs text-slate-500">{formatBytes(file.size)} · click to change</span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-brand-700">Choose a file</span>
            <span className="text-sm text-slate-600"> or drag it here</span>
            <span className="mt-1 text-xs text-slate-500">
              {hint ?? `${accept.join(", ")} up to ${formatBytes(maxBytes)}`}
            </span>
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept.join(",")}
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
