import { VibeDetailWorkspace } from "@/components/vibes/VibeDetailWorkspace";

export default async function VibeDetailPage({ params }: { params: Promise<{ vibeId: string }> }) {
  const { vibeId } = await params;
  return <VibeDetailWorkspace vibeId={vibeId} />;
}
