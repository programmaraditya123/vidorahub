"use client";

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

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const currentJob = await getVibeJob(jobId);
        if (!alive) return;
        setJob(currentJob);
        setError("");
        if (currentJob.status === "COMPLETED") {
          const result = await getJobVibes(jobId);
          if (alive) setVibes(result.vibes);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not load this job.");
      }
    }
    load();
    const interval = window.setInterval(() => {
      if (!job || !terminal.has(job.status)) load();
    }, 2500);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [jobId, job]);

  async function cancel() {
    const cancelled = await cancelVibeJob(jobId);
    setJob(cancelled);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState message={error} />
      </main>
    );
  }

  if (!job) {
    return <main className="mx-auto max-w-4xl px-4 py-10 text-sm text-zinc-600">Loading job...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">{job.source_type}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Vibe job</h1>
          <p className="mt-2 max-w-2xl break-all text-sm text-zinc-600">{job.source_url}</p>
        </div>
        {!terminal.has(job.status) ? (
          <button className="min-h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800" onClick={cancel}>
            Cancel
          </button>
        ) : null}
      </header>
      {job.status === "FAILED" && job.error ? <ErrorState title={job.error.code} message={job.error.message} /> : null}
      {job.status === "CANCELLED" ? <ErrorState title="Cancelled" message="This processing job was cancelled." /> : null}
      {job.status !== "COMPLETED" ? <ProcessingPipeline current={job.current_stage} progress={job.progress} /> : <VibeGrid vibes={vibes} />}
    </main>
  );
}
