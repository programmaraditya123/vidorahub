"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Vibe, VibeJob } from "@/lib/api/types";
import { cancelVibeJob, getJobVibes, getVibeJob } from "@/lib/api/vibeJobs";
import { ErrorState } from "./ErrorState";
import { ProcessingPipeline } from "./ProcessingPipeline";
import { VibeGrid } from "./VibeGrid";
const terminal = new Set(["COMPLETED", "FAILED", "CANCELLED"]);
export function JobWorkspace({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<VibeJob | null>(null);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => {
    let alive = true, timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    async function load() {
      let finished = false;
      try {
        const current = await getVibeJob(jobId);
        if (!alive) return;
        setJob(current); setError(""); failures = 0;
        if (current.status === "COMPLETED") {
          const result = await getJobVibes(jobId);
          if (alive) setVibes(result.vibes);
        }
        finished = terminal.has(current.status);
      } catch (err) { failures++; if (alive) setError(err instanceof Error ? err.message : "Could not load this video."); }
      // Recursive timeout: no overlapping requests or effect loops as progress updates.
      if (alive && !finished) timer = setTimeout(load, Math.min(30000, 3000 * 2 ** Math.min(failures, 3)));
    }
    void load();
    return () => { alive = false; clearTimeout(timer); };
  }, [jobId]);
  async function cancel() {
    setCancelling(true);
    try { setJob(await cancelVibeJob(jobId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Cancellation failed."); }
    finally { setCancelling(false); }
  }
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10">
    <Link href="/vibes/create" className="text-sm font-semibold text-teal-700">Back to your workspace</Link>
    {error && <ErrorState message={error} />}
    {!job ? <p role="status">Loading your video…</p> : <>
      <header className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{job.source_type}</p><h1 className="mt-3 text-3xl font-semibold">{job.status === "COMPLETED" ? "Your moments are ready." : "Finding the good parts."}</h1><p className="mt-2 max-w-2xl break-all text-sm text-zinc-500">{job.source_url}</p></div>
      {!terminal.has(job.status) && <button disabled={cancelling} className="rounded-lg border border-zinc-300 px-4 py-3 text-sm" onClick={cancel}>{cancelling ? "Cancelling…" : "Cancel processing"}</button>}</header>
      {job.warning && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{job.warning}</p>}
      {job.status === "FAILED" && <ErrorState message={job.error?.message ?? "Processing failed. Try another video."} />}
      {job.status === "CANCELLED" && <p className="rounded-xl bg-zinc-100 p-6">Processing cancelled. You can start another video from your workspace.</p>}
      {!terminal.has(job.status) && <><ProcessingPipeline current={job.current_stage} progress={job.progress} transcription={job.transcription} /><p className="text-sm text-zinc-500">You can leave this page. Processing continues and your clips will appear in your workspace.</p></>}
      {job.status === "COMPLETED" && <VibeGrid vibes={vibes} />}
    </>}
  </main>;
}
