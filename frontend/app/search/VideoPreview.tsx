"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SearchGrid.module.scss";

type VideoPreviewProps = {
  src: string;
  poster: string;
  title: string;
  creator: string;
  onClose: () => void;
};

export default function VideoPreview({ src, poster, title, creator, onClose }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let destroyStream: (() => void) | undefined;

    const play = () => {
      void video.play().catch(() => {
        if (!disposed) setFailed(true);
      });
    };

    const start = async () => {
      if (/\.m3u8(?:\?|$)/i.test(src) && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (disposed) return;
        if (!Hls.isSupported()) {
          setFailed(true);
          return;
        }
        const stream = new Hls();
        destroyStream = () => stream.destroy();
        stream.on(Hls.Events.MANIFEST_PARSED, play);
        stream.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal && !disposed) setFailed(true);
        });
        stream.loadSource(src);
        stream.attachMedia(video);
      } else {
        video.src = src;
        play();
      }
    };

    void start().catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true;
      video.pause();
      destroyStream?.();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  useEffect(() => {
    const preventScroll = (event: TouchEvent) => event.preventDefault();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const handleVisibility = () => { if (document.hidden) onClose(); };
    window.addEventListener("pointerup", onClose);
    window.addEventListener("pointercancel", onClose);
    window.addEventListener("blur", onClose);
    window.addEventListener("keydown", handleKey);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("pointerup", onClose);
      window.removeEventListener("pointercancel", onClose);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.previewOverlay}>
      <div className={styles.previewCard} role="region" aria-label={`Video preview: ${title}`}>
        <div className={styles.previewMedia}>
          <video
            ref={videoRef}
            poster={poster}
            muted
            playsInline
            loop
            disablePictureInPicture
            onPlaying={() => setPlaying(true)}
            onError={() => setFailed(true)}
            aria-label={title}
          />
          {(!playing || failed) && <p className={styles.previewStatus} role="status">
            {failed ? "Preview unavailable. Tap the video to watch." : "Loading preview…"}
          </p>}
          <span className={styles.previewMuted}>Muted preview</span>
        </div>
        <div className={styles.previewInfo}>
          <strong>{creator}</strong>
          <p>{title}</p>
          <span>Release to close</span>
        </div>
      </div>
    </div>,
    document.getElementById("portal-root") || document.body,
  );
}
