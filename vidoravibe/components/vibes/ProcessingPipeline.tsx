import type { JobStatus } from "@/lib/api/types";

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

export function ProcessingPipeline({ current, progress }: { current: JobStatus; progress: number }) {
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
