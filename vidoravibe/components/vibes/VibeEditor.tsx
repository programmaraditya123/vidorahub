"use client";

import { useState } from "react";

import type { Vibe } from "@/lib/api/types";
import { updateVibe } from "@/lib/api/vibes";

export function VibeEditor({ vibe }: { vibe: Vibe }) {
  const [title, setTitle] = useState(vibe.title);
  const [start, setStart] = useState(vibe.start_time);
  const [end, setEnd] = useState(vibe.end_time);
  const [saved, setSaved] = useState("");

  async function save() {
    await updateVibe(vibe._id, { title, start_time: start, end_time: end });
    setSaved("Saved");
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-950">Editor</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-zinc-700">
          Title
          <input className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3" value={title} onChange={(event) => setTitle(event.target.value)} />
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
        <button className="min-h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white" onClick={save}>
          Save
        </button>
        <span className="text-sm text-zinc-500">{saved}</span>
      </div>
    </section>
  );
}
