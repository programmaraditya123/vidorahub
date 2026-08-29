"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createVibeJob } from "@/lib/api/vibeJobs";
import { VidoraVibeApiError } from "@/lib/api/client";
import { ErrorState } from "./ErrorState";
import { VideoSourceInput } from "./VideoSourceInput";

export function CreateVibeWorkspace() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(sourceUrl: string) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createVibeJob(sourceUrl);
      window.localStorage.setItem("vidoravibe:lastJobId", result.job._id);
      router.push(`/vibes/jobs/${result.job._id}`);
    } catch (err) {
      const message =
        err instanceof VidoraVibeApiError ? err.message : "VidoraVibe could not create the job. Try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">VidoraVibe</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
          Turn long videos into meaningful Vibes.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600">
          Paste a source link and VidoraVibe will create a persistent processing job that validates, analyzes, and prepares short-form clips.
        </p>
      </header>
      <VideoSourceInput disabled={submitting} onSubmit={submit} />
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
