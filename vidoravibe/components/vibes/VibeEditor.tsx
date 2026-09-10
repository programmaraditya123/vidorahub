"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Vibe } from "@/lib/api/types";
import { updateVibe } from "@/lib/api/vibes";

export function VibeEditor({ vibe }: { vibe: Vibe }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(vibe.title);
  const [start, setStart] = useState(vibe.start_time);
  const [end, setEnd] = useState(vibe.end_time);
  const [saved, setSaved] = useState("");

  async function save() {
    if (busy) return;
    if (!title.trim() || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end - start < 25 || end - start > 60) {
      setSaved("Enter a title and a duration between 25 and 60 seconds."); return;
    }
    setBusy(true);
    try {
      const result = await updateVibe(vibe._id, { title, start_time: start, end_time: end });
      router.push(`/vibes/jobs/${result.job_id}`);
    } catch (err) { setSaved(err instanceof Error ? err.message : "Could not save this clip."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-950">Editor</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-zinc-700">
          Title
          <input className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3" maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Start time
          <input className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3" type="number" value={start} onChange={(event) => setStart(Number(event.target.value))} />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          End time
          <input className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3" type="number" value={end} onChange={(event) => setEnd(Number(event.target.value))} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="min-h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white" disabled={busy} onClick={save}>
          {busy ? "Preparing render…" : "Save and render"}
        </button>
        <span role="status" className="text-sm text-zinc-500">{saved}</span>
      </div>
    </section>
  );
}
