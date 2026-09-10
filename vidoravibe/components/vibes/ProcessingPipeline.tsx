import type { JobStatus, VibeJob } from "@/lib/api/types";

const stages: Array<{ status: JobStatus; label: string }> = [
  { status: "VALIDATING", label: "Video source verified" },
  { status: "DOWNLOADING", label: "Video acquired" },
  { status: "EXTRACTING_AUDIO", label: "Extracting audio" },
  { status: "TRANSCRIBING", label: "Transcribing" },
  { status: "ANALYZING", label: "Understanding content" },
  { status: "DETECTING_VIBES", label: "Finding meaningful moments" },
  { status: "GENERATING_VIBES", label: "Creating Vibes" },
  { status: "FINALIZING", label: "Preparing previews" },
];

function clock(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function ProcessingPipeline({ current, progress, transcription }: {
  current: JobStatus;
  progress: number;
  transcription?: VibeJob["transcription"];
}) {
  const currentIndex = stages.findIndex((stage) => stage.status === current);
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-zinc-950">Processing</h2>
        <span className="text-sm font-semibold text-teal-800">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded bg-zinc-100">
        <div className="h-full bg-teal-700 transition-all" style={{ width: `${progress}%` }} />
      </div>
      {current === "TRANSCRIBING" && transcription && (
        <div className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-900" role="status" aria-live="polite">
          {transcription.phase === "loading_model" ? "Preparing the speech model..." :
            transcription.phase === "preparing_audio" ? "Finding speech in your audio..." :
            transcription.phase === "cached" ? "Reusing your completed transcript." :
            `Transcribed ${clock(transcription.processed_seconds)} of ${clock(transcription.total_seconds)}`}
          {transcription.elapsed_seconds > 0 && <span className="ml-2 text-teal-700">Elapsed {clock(transcription.elapsed_seconds)}</span>}
        </div>
      )}
      <ol className="mt-5 space-y-3">
        {stages.map((stage, index) => {
          const complete = current === "COMPLETED" || index < currentIndex;
          const active = stage.status === current;
          return (
            <li key={stage.status} className="flex items-center gap-3 text-sm">
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs ${
                  complete
                    ? "border-teal-700 bg-teal-700 text-white"
                    : active
                      ? "border-teal-700 text-teal-800"
                      : "border-zinc-300 text-zinc-400"
                }`}
              >
                {complete ? "✓" : active ? "•" : "○"}
              </span>
              <span className={active ? "font-semibold text-zinc-950" : "text-zinc-600"}>{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
