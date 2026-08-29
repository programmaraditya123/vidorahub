import type { DetectedSource } from "@/lib/vibes/source";

export function SourceBadge({ detected }: { detected: DetectedSource | null }) {
  if (!detected) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
      <span aria-hidden="true">✓</span>
      <span>{detected.message}</span>
    </div>
  );
}
