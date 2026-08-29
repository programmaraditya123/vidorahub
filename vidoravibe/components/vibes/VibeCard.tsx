import Link from "next/link";

import type { Vibe } from "@/lib/api/types";

export function VibeCard({ vibe }: { vibe: Vibe }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-[9/16] w-full overflow-hidden rounded-t-lg bg-zinc-900">
        {vibe.video_url ? (
          <video src={vibe.video_url} className="size-full object-cover" controls preload="metadata" />
        ) : (
          <div className="grid size-full place-items-center px-4 text-center text-sm text-zinc-300">Preview pending render</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">{vibe.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">{Math.round(vibe.duration)}s from source</p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="rounded bg-teal-50 px-2 py-1 font-semibold text-teal-800">
            Score {Math.round(vibe.vibe_score)}
          </span>
          <span className="text-zinc-500">{vibe.status}</span>
        </div>
        <div className="flex gap-2">
          <Link className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-center text-xs font-semibold text-zinc-800" href={`/vibes/${vibe._id}`}>
            Preview
          </Link>
          <a
            className={`flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold ${
              vibe.video_url ? "bg-teal-700 text-white" : "bg-zinc-200 text-zinc-500"
            }`}
            href={vibe.video_url ?? undefined}
            aria-disabled={!vibe.video_url}
          >
            Download
          </a>
        </div>
      </div>
    </article>
  );
}
