import { JobWorkspace } from "@/components/vibes/JobWorkspace";

export default async function VibeJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobWorkspace jobId={jobId} />;
}
