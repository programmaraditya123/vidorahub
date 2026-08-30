"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFloatingVideoPlayer } from "./FloatingVideoPlayerProvider";
import styles from "./FloatingVideoPlayer.module.scss";

type Props = {
  src: string;
  videoId: string;
  title?: string;
};

export default function FloatingVideoPlayerSlot({ src, videoId, title }: Props) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const { registerSlot, setActiveVideo } = useFloatingVideoPlayer();

  useEffect(() => {
    registerSlot(slotRef.current);

    return () => registerSlot(null);
  }, [registerSlot]);

  useEffect(() => {
    if (!src || !videoId) return;

    setActiveVideo({
      src,
      videoId,
      title,
      watchPath: pathname,
    });
  }, [pathname, setActiveVideo, src, title, videoId]);

  return <div className={styles.inlineSlot} ref={slotRef} />;
}
