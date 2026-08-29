"use client";

import { useEffect, useState } from "react";

import { getVibe } from "@/lib/api/vibes";
import type { Vibe } from "@/lib/api/types";
import { ErrorState } from "./ErrorState";
import { ExportActions } from "./ExportActions";
import { VibeEditor } from "./VibeEditor";

export function VibeDetailWorkspace({ vibeId }: { vibeId: string }) {
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getVibe(vibeId)
      .then(setVibe)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this Vibe."));
  }, [vibeId]);

  if (error) return <main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} /></main>;
  if (!vibe) return <main className="mx-auto max-w-4xl px-4 py-10 text-sm text-zinc-600">Loading Vibe...</main>;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(260px,360px)_1fr]">
      <section className="overflow-hidden rounded-lg bg-zinc-950">
        {vibe.video_url ? <video src={vibe.video_url} className="aspect-[9/16] w-full object-cover" controls /> : <div className="grid aspect-[9/16] place-items-center p-6 text-center text-sm text-zinc-300">Preview pending render</div>}
      </section>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-semibold text-teal-800">Score {Math.round(vibe.vibe_score)}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950">{vibe.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{vibe.hook}</p>
        </header>
        <VibeEditor vibe={vibe} />
        <ExportActions vibe={vibe} />
      </div>
    </main>
  );
}
