import type { Vibe } from "@/lib/api/types";
import { EmptyState } from "./EmptyState";
import { VibeCard } from "./VibeCard";

export function VibeGrid({ vibes }: { vibes: Vibe[] }) {
  if (!vibes.length) return <EmptyState message="No Vibes are available yet." />;
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vibes.map((vibe) => (
        <VibeCard key={vibe._id} vibe={vibe} />
      ))}
    </section>
  );
}
