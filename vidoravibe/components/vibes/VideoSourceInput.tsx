"use client";

import { useMemo, useState } from "react";

import { detectSource } from "@/lib/vibes/source";
import { SourceBadge } from "./SourceBadge";

export function VideoSourceInput({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (url: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const detected = useMemo(() => detectSource(value), [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste a video link first.");
      return;
    }
    if (!detected) {
      setError("Use a supported YouTube, VidoraHub, or Google Cloud Storage URL.");
      return;
    }
    setError("");
    onSubmit(trimmed);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <label htmlFor="video-source" className="block text-sm font-semibold text-zinc-900">
        Paste your video link
      </label>
      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <input
          id="video-source"
          className="min-h-12 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          placeholder="https://youtube.com/watch?v=..."
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          disabled={disabled}
          aria-describedby="source-help source-error"
        />
        <button
          type="button"
          className="min-h-12 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={disabled}
          onClick={submit}
        >
          {disabled ? "Creating..." : "Create Vibes"}
        </button>
      </div>
      <div id="source-help" className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span className="rounded bg-zinc-100 px-2 py-1">YouTube</span>
        <span className="rounded bg-zinc-100 px-2 py-1">VidoraHub</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Google Cloud Storage</span>
      </div>
      <div className="mt-4 min-h-9">
        <SourceBadge detected={detected} />
        {error ? (
          <p id="source-error" className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
