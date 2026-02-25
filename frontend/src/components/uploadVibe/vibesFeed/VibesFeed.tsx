"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import styles from "./VibesFeed.module.scss";
import { http } from "@/src/lib/http";
import VibeActions from "../VibeActionsSidebar/VibeActions";
import { postView } from "@/src/lib/video/videodata";
import VibeMeta from "../VibeMeta/VibeMeta";

interface VibeItem {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  contentType?: string;
  videoUrl: string;
  videoSerialNumber: number;
  createdAt: string;
  isDeleted: boolean;
  uploader: {
    _id: string;
    name: string;
    profilePicture?: string;
    subscriber: number;           
    userSerialNumber: number; 
  };
  stats: {
    views: number;
    likes: number;
  };
}

export default function VibesFeed() {
  const [vibes, setVibes] = useState<VibeItem[]>([]);
  const watchStartRef = useRef<Map<string, number>>(new Map());
  const viewedRef = useRef<Set<string>>(new Set());
  const sessionIdRef = useRef<string>("");
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    loadVibes();
  }, []);

  useEffect(() => {
    let sid = sessionStorage.getItem("vibe_session_id");

    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("vibe_session_id", sid);
    }

    sessionIdRef.current = sid;
  }, []);

  const loadVibes = async () => {
    const res = await http.get("/api/v1/allvibes?limit=10");

    const normalized = res.data.items.map((item: any) => ({
      ...item,
      contentType: item.contentType || item.Contenttype || "vibe",
    }));

    setVibes(normalized);
  };

  const getFallbackAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;

  const sendView = async (videoId: string) => {
  if (viewedRef.current.has(videoId)) return;

  const startTime = watchStartRef.current.get(videoId);
  if (!startTime) return;

  const watchTime = Math.floor((Date.now() - startTime) / 1000);

  if (watchTime < 3) return;

  try {
    await postView({
      videoId, 
      sessionId: sessionIdRef.current,
      watchTime,
    });

    viewedRef.current.add(videoId);
    watchStartRef.current.delete(videoId);  
  } catch (err) {
    console.log("View post failed", err);
  }
};

  useEffect(() => {
    return () => {
      vibes.forEach((vibe) => {
        sendView(vibe._id);
      });
    };
  }, [vibes]);

 useEffect(() => {
  if (!vibes.length) return;

  let activeVideoId: string | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        const id = video.dataset.id as string;

        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          // If this video is already active → do nothing
          if (activeVideoId === id) return;

          // Pause previous active video
          if (activeVideoId) {
            const prev = videoRefs.current.get(activeVideoId);
            if (prev) {
              prev.pause();
              sendView(activeVideoId);
            }
          }

          // Play new active video
          video.play().catch(() => {});
          watchStartRef.current.set(id, Date.now());
          activeVideoId = id;
        }
      });
    },
    {
      threshold: 0.6,
    }
  );

  videoRefs.current.forEach((video) => {
    observer.observe(video);
  });

  return () => {
    observer.disconnect();
  };
}, [vibes]);

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.feed}>
        {vibes.map((vibe) => (
          <div key={vibe._id} className={styles.vibeCard}>
            <video
              className={styles.video}
              src={vibe.videoUrl}
              poster={vibe.thumbnailUrl}
              // muted
              loop
              playsInline
              data-id={vibe._id}
              onLoadedMetadata={(e) => {
                  const video = e.currentTarget;

                  const isVertical =
                    video.videoHeight > video.videoWidth;

                  if (isVertical) {
                    video.style.objectFit = "cover";
                  } else {
                    video.style.objectFit = "contain";
                  }
                }}
              onPlay={() => {
                watchStartRef.current.set(vibe._id, Date.now());
              }}
              onPause={() => {
                sendView(vibe._id);
              }}
              ref={(el) => {
                  if (el) {
                    videoRefs.current.set(vibe._id, el);
                  } else {
                    videoRefs.current.delete(vibe._id);
                  }
                }}
            />

            <VibeActions
              videoSerialNumber={vibe.videoSerialNumber}
              thumbnailUrl={vibe.thumbnailUrl || ""}
              totalViews={vibe.stats.views}
            />
            

            <div className={styles.overlay}>
              <div className={styles.meta}>
                
                <VibeMeta uploader={vibe.uploader}/>


                {/* <div className={styles.userRow}>
                  <img
                    src={
                      vibe.uploader.profilePicture ||
                      getFallbackAvatar(vibe.uploader.name)
                    }
                    alt="profile"
                    className={styles.avatar}
                  />
                  <span className={styles.username}>@{vibe.uploader.name}</span>
                </div> */}

                <p className={styles.title}>{vibe.title}</p>

                {vibe.description && (
                  <p className={styles.description}>{vibe.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
