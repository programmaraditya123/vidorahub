"use client";

import { useState } from "react";

import type { Vibe } from "@/lib/api/types";
import { getVibeDownload } from "@/lib/api/vibes";

export function ExportActions({ vibe }: { vibe: Vibe }) {
  const [message, setMessage] = useState("");

  async function download() {
    try {
      const result = await getVibeDownload(vibe._id);
      window.location.href = result.download_url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download is not available yet.");
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-950">Export</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="min-h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white disabled:bg-zinc-300" disabled={!vibe.video_url} onClick={download}>
          Download
        </button>
        <button className="min-h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800" disabled>
          Publish to VidoraHub
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
    </section>
  );
}
