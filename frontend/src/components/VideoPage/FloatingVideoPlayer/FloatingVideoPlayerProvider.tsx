"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import VideoPlayer from "@/src/components/VideoPage/VideoPlayer/VideoPlayer";
import styles from "./FloatingVideoPlayer.module.scss";

type ActiveVideo = {
  src: string;
  videoId: string;
  title?: string;
  watchPath?: string;
};

type SlotRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type FloatingVideoPlayerContextValue = {
  registerSlot: (node: HTMLDivElement | null) => void;
  setActiveVideo: (video: ActiveVideo) => void;
  isMiniPlayerVisible: boolean;
};

const FloatingVideoPlayerContext =
  createContext<FloatingVideoPlayerContextValue | null>(null);

export function useFloatingVideoPlayer() {
  const context = useContext(FloatingVideoPlayerContext);

  if (!context) {
    throw new Error(
      "useFloatingVideoPlayer must be used inside FloatingVideoPlayerProvider",
    );
  }

  return context;
}

const isBlockedFloatingRoute = (pathname: string) =>
  pathname === "/video" ||
  pathname.startsWith("/video/") ||
  pathname === "/vibes" ||
  pathname.startsWith("/vibes/");

const rectChanged = (current: SlotRect | null, next: SlotRect) =>
  !current ||
  Math.abs(current.top - next.top) > 0.5 ||
  Math.abs(current.left - next.left) > 0.5 ||
  Math.abs(current.width - next.width) > 0.5 ||
  Math.abs(current.height - next.height) > 0.5;

export default function FloatingVideoPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [slotRect, setSlotRect] = useState<SlotRect | null>(null);
  const [activeVideo, setActiveVideoState] = useState<ActiveVideo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const registerSlot = useCallback((node: HTMLDivElement | null) => {
    setSlot(node);
    if (!node) setSlotRect(null);
  }, []);

  const setActiveVideo = useCallback((video: ActiveVideo) => {
    setActiveVideoState((current) => {
      if (
        current?.src === video.src &&
        current.videoId === video.videoId &&
        current.title === video.title &&
        current.watchPath === video.watchPath
      ) {
        return current;
      }

      return video;
    });
    setIsDismissed(false);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setActiveVideoState(null);
    setIsDismissed(true);
  }, []);

  const openVideoPage = useCallback(() => {
    const watchPath = activeVideo?.watchPath;

    if (!watchPath || pathname === watchPath) return;

    router.push(watchPath);
  }, [activeVideo?.watchPath, pathname, router]);

  const handleCloseMiniPlayer = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      closeMiniPlayer();
    },
    [closeMiniPlayer],
  );

  const handleOpenVideoPage = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      openVideoPage();
    },
    [openVideoPage],
  );

  useLayoutEffect(() => {
    if (!slot) return;

    let animationFrame = 0;

    const measureSlot = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const rect = slot.getBoundingClientRect();
        const nextRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setSlotRect((current) =>
          rectChanged(current, nextRect) ? nextRect : current,
        );
      });
    };

    measureSlot();

    const resizeObserver = new ResizeObserver(measureSlot);
    resizeObserver.observe(slot);
    window.addEventListener("resize", measureSlot);
    window.addEventListener("scroll", measureSlot, true);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureSlot);
      window.removeEventListener("scroll", measureSlot, true);
    };
  }, [slot]);

  const miniPlayerVisible =
    Boolean(activeVideo) &&
    !slot &&
    !isDismissed &&
    !isBlockedFloatingRoute(pathname);
  const waitingForSlotMeasure = Boolean(activeVideo && slot && !slotRect);
  const inlinePlayerVisible = Boolean(activeVideo && slot && slotRect);
  const hiddenDuringBlockedRoute = Boolean(
    activeVideo &&
      !slot &&
      !miniPlayerVisible &&
      !isDismissed &&
      isBlockedFloatingRoute(pathname),
  );
  const playerVisible =
    inlinePlayerVisible ||
    waitingForSlotMeasure ||
    miniPlayerVisible ||
    hiddenDuringBlockedRoute;

  const contextValue = useMemo(
    () => ({
      registerSlot,
      setActiveVideo,
      isMiniPlayerVisible: miniPlayerVisible,
    }),
    [miniPlayerVisible, registerSlot, setActiveVideo],
  );

  const frameStyle = useMemo<CSSProperties | undefined>(() => {
    if (!inlinePlayerVisible || !slotRect) return undefined;

    return {
      top: slotRect.top,
      left: slotRect.left,
      width: slotRect.width,
      height: slotRect.height,
    };
  }, [inlinePlayerVisible, slotRect]);

  const miniPlayerLabel = activeVideo?.title
    ? `Mini player: ${activeVideo.title}`
    : "Mini video player";

  return (
    <FloatingVideoPlayerContext.Provider value={contextValue}>
      {children}

      {activeVideo && playerVisible ? (
        <div
          className={`${styles.playerFrame} ${
            inlinePlayerVisible
              ? styles.inlineFrame
              : miniPlayerVisible
                ? styles.miniPlayer
                : styles.hiddenFrame
          }`}
          style={frameStyle}
          aria-label={inlinePlayerVisible ? undefined : miniPlayerLabel}
          title={inlinePlayerVisible ? undefined : miniPlayerLabel}
        >
          {miniPlayerVisible ? (
            <div className={styles.miniToolbar}>
              {activeVideo.watchPath ? (
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={handleOpenVideoPage}
                  aria-label="Open video page"
                  title="Open video page"
                >
                  <span className="material-symbols-outlined">open_in_full</span>
                </button>
              ) : null}
              <button
                type="button"
                className={styles.miniButton}
                onClick={handleCloseMiniPlayer}
                aria-label="Close mini player"
                title="Close mini player"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ) : null}

          <div className={styles.playerViewport}>
            <VideoPlayer
              key={`${activeVideo.videoId}:${activeVideo.src}`}
              src={activeVideo.src}
              videoId={activeVideo.videoId}
              compact={!inlinePlayerVisible}
            />
          </div>
        </div>
      ) : null}
    </FloatingVideoPlayerContext.Provider>
  );
}
