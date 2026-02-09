import VideoPageClient from "./VideoPageClient";
import { decodeFilename } from "@/src/functions";
import { getVideoMetadataExceptCommentsDocs } from "@/src/lib/video/videodata";

export async function generateMetadata({
  params,
}: {
  params: { slug: string | string[] };
}) {
  const encoded = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug;

  if (!encoded) {
    return { title: "VidoraHub" };
  }

  const decoded = decodeFilename(encoded);

  const res = await getVideoMetadataExceptCommentsDocs(decoded);
  const video = res?.data?.data;

  if (!video) {
    return { title: "VidoraHub" };
  }

  const ogImage = `${
    process.env.NEXT_PUBLIC_SITE_URL
  }/api/og?title=${encodeURIComponent(
    video.title
  )}&thumb=${encodeURIComponent(video.thumbnailUrl)}`;

  return {
    title: video.title,
    description: video.description,
    openGraph: {
      title: video.title,
      description: video.description,
      images: [ogImage],
      type: "video.other",
    },
  };
}

export default function Page() {
  return <VideoPageClient />;
}
