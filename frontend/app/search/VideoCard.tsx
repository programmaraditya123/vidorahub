import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import VideoPreview from "./VideoPreview";
import styles from "./SearchGrid.module.scss";
import { encodeFilename } from "@/src/functions";
import { setVideoId } from "@/src/utils/videoStorage";

interface VideoCardProps {
  image: string;
  title: string;
  creator: string;
  time: string;
  videoUrl: string;
  id: string;
}

export default function VideoCard({
  image,
  title,
  creator,
  time,
  videoUrl,
  id,
}: VideoCardProps) {
  const router = useRouter();
  const precomputedPath = useRef<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const clearHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  const closePreview = useCallback(() => {
    clearHold();
    touchStart.current = null;
    setPreviewOpen(false);
  }, [clearHold]);

  useEffect(() => () => clearHold(), [clearHold]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    suppressClick.current = false;
    if (event.pointerType !== "touch" || !event.isPrimary || !videoUrl) return;
    clearHold();
    touchStart.current = { x: event.clientX, y: event.clientY };
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      suppressClick.current = true;
      setPreviewOpen(true);
    }, 450);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = touchStart.current;
    if (!start || previewOpen) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      clearHold();
      touchStart.current = null;
      suppressClick.current = true;
    }
  };


  const handleMouseEnter = useCallback(() => {
    if (!videoUrl || precomputedPath.current) return;

    const lastPart = videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart! + id);
    precomputedPath.current = `/video/${encoded}`;

    router.prefetch(precomputedPath.current);
  }, [videoUrl, id, router]);


  const handleNavigate = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!videoUrl) return;


    if (!precomputedPath.current) {
      const lastPart = videoUrl.split("vidorahub/")[1];
      const encoded = encodeFilename(lastPart! + id);
      precomputedPath.current = `/video/${encoded}`;
    }

    setVideoId(id);
    localStorage.setItem("thubnailUrl", image);

    router.push(precomputedPath.current);
  }, [videoUrl, id, image, router]);

  return (
    <>
    <button
      type="button"
      className={styles.card}
      aria-label={`${title} by ${creator}, ${time}`}
      onClick={handleNavigate}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={closePreview}
      onPointerCancel={closePreview}
      onLostPointerCapture={closePreview}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className={styles.thumb} style={{ backgroundImage: `url(${image})` }} />
      <span className={styles.duration}>{time}</span>
      <span className={styles.videoIcon} aria-hidden="true">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="17" rx="4" />
          <path d="M3 10h18M8 4l4 6m3-6 4 6" />
          <path d="m10 13 5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={styles.play} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </span>
      <span className={styles.cardBody}>
        <span className={styles.title}>{title}</span>
        <span className={styles.creator}>
          <span className={styles.avatar} aria-hidden="true">{creator.charAt(0).toUpperCase()}</span>
          <span>{creator}</span>
        </span>
      </span>
    </button>
    {previewOpen && (
      <VideoPreview src={videoUrl} poster={image} title={title} creator={creator} onClose={closePreview} />
    )}
    </>
  );
}
